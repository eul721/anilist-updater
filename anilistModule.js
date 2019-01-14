const fetch = require('node-fetch')
const { GraphQLClient  } = require('graphql-request')

const oAuthToken = process.env.anilistOAuthToken


const ANILIST_ENDPOINT = 'https://graphql.anilist.co'

const graphQLClient = new GraphQLClient(ANILIST_ENDPOINT, {
    headers: {
      authorization: 'Bearer ' + oAuthToken,
    },
  })


const query = `query($title: String){
    Media (search: $title, type: ANIME) {
    id  
    idMal 
    relations {
        edges {
        id
        relationType
        }
        #edges(relationType:\"SEQUEL\"){id}  
    } 
    title {
        romaji      
        english      
        native    
    }  
    episodes
    }
}`

const findAnimeByID = `query($aniID: Int){
    Media (id: $aniID, type: ANIME) {
    id  
    idMal 
    mediaListEntry{
        id
        status
        progress
    }
    relations {
        edges {
        id
        relationType
        }
        #edges(relationType:\"SEQUEL\"){id}  
    } 
    title {
        romaji      
        english      
        native    
    }  
    episodes
    }
}`

const user = `query{
    Viewer{
        id
        name
    }
}`

const mutation = `mutation($about: String){
    UpdateUser (about: $about) {
        name
        about
    }
}`


const SaveMediaListEntry = `mutation($mediaId: Int, $progress: Int, $status: MediaListStatus, $listEntryId: Int){
    SaveMediaListEntry(mediaId:$mediaId, progress:$progress, status: $status, id: $listEntryId){
        mediaId
        progress
        status
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