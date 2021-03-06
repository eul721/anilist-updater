const { GraphQLClient  } = require('graphql-request')
const oAuthToken = process.env.anilistOAuthToken

const ANILIST_ENDPOINT = 'https://graphql.anilist.co'

const headers = oAuthToken? { authorization: 'Bearer ' + oAuthToken, } : {}
const graphQLClient = new GraphQLClient(ANILIST_ENDPOINT, {headers: headers})

const findAnimeByID = `query($aniID: Int){
    Media (id: $aniID, type: ANIME) {
    id  
    mediaListEntry{
        id
        status
        progress
    }
    title {
        romaji      
        english      
        native    
    }  
    coverImage {
        large
    }
    episodes
    }
}`

const findAnimeByTitleAndYear = `query($searchString: String, $dateStarted: String){
    Animes: Page{
      media(search: $searchString, startDate_like: $dateStarted) {
        id
        title{
          english
          romaji
          native
        }
      }
    }
  }`

const SaveMediaListEntry = `mutation($mediaId: Int, $progress: Int, $status: MediaListStatus, $listEntryId: Int){
    updateResult:SaveMediaListEntry(mediaId:$mediaId, progress:$progress, status: $status, id: $listEntryId){
        mediaId
        progress
        status
    		media {
                title {
                    english
                    romaji
                    userPreferred
                }
                siteUrl
                coverImage{
                    large
                }
            }
        updatedAt
    }
}`

const saveListEntry = async function(vars){
    return graphQLClient.request(SaveMediaListEntry, vars);
}

// List updates are handled by this function
// Expects aniListID and progress (int)
module.exports.mutation = async (vars) => {
    var totalEpisodes
    return graphQLClient.request(findAnimeByID, vars)
        .then(async (response) => {
            totalEpisodes = response.Media.episodes;
            return (response.Media.mediaListEntry) ? response.Media.mediaListEntry : false;
        })
        .then(async (listEntry) => {
            if (listEntry != false) {
                // If currently in list, as WATCHING
                if (listEntry.status == "COMPLETED" ){
                    vars.status = "REPEATING"
                    vars.listEntryId = listEntry.id
                    // For whatever reason Anilist API does not take the 'progress' param when setting as REPEATING, so 2 calls are required.
                    await saveListEntry(vars); 
                } else if (listEntry.status == "REPEATING"){
                // EIther completed or repeating
                    vars.listEntryId = listEntry.id
                    if (vars.progress == totalEpisodes) {
                        vars.status = "COMPLETED"
                    }
                } else {
                    vars.status = "CURRENT"
                    vars.listEntryId = listEntry.id
                    if (vars.progress == totalEpisodes) {
                        vars.status = "COMPLETED"
                    }
                }
            } else {
                vars.status = "CURRENT";
                vars.mediaId = vars.aniID; 
            }
            return await saveListEntry(vars);
        } )
};

module.exports.query = async (vars) => {
    return graphQLClient.request(findAnimeByID, vars)
}

module.exports.search = async (vars) => {
    return graphQLClient.request(findAnimeByTitleAndYear, vars)
}