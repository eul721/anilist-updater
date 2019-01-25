'use strict';

const express = require('express')
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const app = express()

const fetch = require('node-fetch')
const anilistModule = require('../lib/anilistModule')

const discordWebhookToken = process.env.discordWebhookToken;

app.use(bodyParser.json());


app.post('/query', async (req, res) => {
  const result = await anilistModule.query(req.body);
  res.send(result);
})

app.post('/mutation', async (req, res) => {
  // const test = await anilistModule.mutation();
  const result = await anilistModule.mutation(req.body);
  res.send(result);
})

app.post('/search', async (req, res) => {
  // const test = await anilistModule.search();
  const result = await anilistModule.search(req.body);
  res.send(result);
})


const apiHandler = serverless(app)

// module.exports.index = serverless(app)
module.exports.index = async (event, context, cb) => {
  if (event.Records){
      // from sqs
      const DiscordWebhookUrl = `https://discordapp.com/api/webhooks/${discordWebhookToken}`
      for (const record of event.Records){
        const recBody = JSON.parse(record.body)
        // const recBody = record
        switch(recBody.Subject){
          case 'ANILIST_UPDATE': {
            const vars = JSON.parse(recBody.Message)
            const anilistUpdateResult = await anilistModule.mutation({
              aniID: vars.ani_id,
              progress: vars.episode
            });
            
            const discordNotifBody = {
              content: 'Anilist Update',
              embeds: [ {
                  title: anilistUpdateResult.updateResult.media.title.userPreferred,
                  color: 65280,
                  fields:[
                    {name: "Anilist ID", value: anilistUpdateResult.updateResult.mediaId},
                    {name: "User's Watch Status", value: anilistUpdateResult.updateResult.status},
                    {name: "Progress", value: anilistUpdateResult.updateResult.progress},
                    {name: "Details", value: `[Anilist link](${anilistUpdateResult.updateResult.media.siteUrl})`}
                  ],
                  image: {url: `${anilistUpdateResult.updateResult.media.coverImage.large}`},
                  footer: {"text":(new Date()).toDateString()}
                } ]
            }
            
            const discordNotif = await fetch(DiscordWebhookUrl, {
              method: 'post',
              body:    JSON.stringify(discordNotifBody),
              headers: { 'Content-Type': 'application/json' }
            })
            console.log(discordNotif);
            
          }break;
        }
      }
      cb(null, "Done")
       
  } else {
      // from api gateway
      return await apiHandler(event, context)
  }
}