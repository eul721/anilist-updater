const tvdb = require('../lib/tvdb')

module.exports.index = async (event, context, cb) => {
    const res = await tvdb.getSeriesSeaonEpisode(event.tvdb_id, event.season, event.episode)
    cb(null, res)
}