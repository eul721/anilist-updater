'use strict';

const express = require('express')
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const app = express()
const anilistModule = require('../lib/anilistModule')

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
      for (const record of event.Records){
        const recBody = JSON.parse(record.body)
        switch(recBody.Subject){
          case 'ANILIST_UPDATE': {
            const vars = JSON.parse(recBody.Message)
            console.log(vars)

            const update = await anilistModule.mutation({
              aniID: vars.ani_id,
              progress: vars.episode
            });
            console.log(update);
            
            
            
          }break;
        }
      }
      cb(null, "Done")
       
  } else {
      // from api gateway
      return await apiHandler(event, context)
  }
}