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

const UpdateMediaListEntries = `mutation($ids: [Int], $status: MediaListStatus, $progress: Int){
    UpdateMediaListEntries(ids:$ids, status:$status, progress: $progress){
        status
        progress
    }
}`

const SaveMediaListEntry = `mutation($mediaId: Int, $progress: Int, $status: MediaListStatus){
    SaveMediaListEntry(mediaId:$mediaId, progress:$progress, status: $status){
        mediaId
        progress
        status
    }
}`

const determineIfInList = async function(response){
    // If in list, return the corresponding mediaListEntryID and status.
    if (response.Media.mediaListEntry){
        return response.Media.mediaListEntry
    }else {
        return false
    }
}

const updateListEntry = async function(vars){
    return graphQLClient.request(UpdateMediaListEntries, vars);
}

const saveListEntry = async function(vars){
    return graphQLClient.request(SaveMediaListEntry, vars);
}


module.exports.mutation = async (vars) => {
    return graphQLClient.request(findAnimeByID, vars)
        .then(determineIfInList)
        .then(async (listEntry) => {
            var result;
            if (listEntry != false) 
                result =  "Watched" ;
            else {
                vars.status = "CURRENT";
                vars.mediaId = vars.aniID; 
                result =  await saveListEntry(vars);
            }
            return result
                
        } )
};

module.exports.query = async (vars) => {
    
    return graphQLClient.request(findAnimeByID, vars).then(data => {
        return data
    })
}