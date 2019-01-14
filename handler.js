'use strict';

const express = require('express')
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const app = express()
const anilistModule = require('./anilistModule')

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



module.exports.index = serverless(app);