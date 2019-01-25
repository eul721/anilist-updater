const tvdb = require('../lib/tvdb')
const anilist = require('../lib/anilistModule')

const AWS = require('aws-sdk')
const express = require('express')
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const app = express()
const SNS = new AWS.SNS()

app.use(bodyParser.json());

app.post('/', async (req, res) => {
    const tvdb_query_res = await tvdb.getSeriesSeaonEpisode(req.body.tvdb_id, req.body.season, 1)
    const airedArr = tvdb_query_res[0].firstAired.split("-")
    const queryRes = await anilist.search({
        searchString: req.body.title.replace(/ \(.*\)/g, ""),
        dateStarted: airedArr[0].concat(airedArr[1]).concat("%%")
    })
    
    
    var params = {
        Message: JSON.stringify({
            ani_id: queryRes.Animes.media[0].id,
            title: req.body.title,
            season: req.body.season,
            episode: req.body.episode
        }), 
        Subject: "ANILIST_UPDATE",
        TopicArn: process.env.topicArn
    };
    const sns_res = await SNS.publish(params).promise()
    res.send({anilistId: queryRes.Animes.media[0].id, snsReqId: sns_res.ResponseMetadata.RequestId})
})



module.exports.index = serverless(app)