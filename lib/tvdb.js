const TVDB = require('node-tvdb')
const APIToken = process.env.tvdb_APIToken


const tvdb = new TVDB(APIToken)

module.exports.getSeriesByName = async (seriesName) => {
    return tvdb.getSeriesByName(seriesName)
}

module.exports.getSeriesById = async (seriesId) => {
    return tvdb.getSeriesById(seriesId)
}

module.exports.getSeriesSeaonEpisode = async (seriesId, season, episode) => {
    return tvdb.getEpisodesBySeriesId(seriesId,{query: {airedSeason: season, airedEpisode:episode}})
}
