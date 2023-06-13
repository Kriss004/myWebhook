// Use dotenv to read .env vars into Node

import dotenv from 'dotenv';
dotenv.config();

const APP_TOKEN = process.env.APP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

//import tokens from './config/tokens';
//import https from 'https';
//import http from 'http';
//import fs from 'fs';
//import request from 'request';
import axios from 'axios';
import path from 'path';
import express from 'express';
import controller from './controller.js';
//import sampledataRouter from './routes/sample_data.js';
import bodyParser from 'body-parser';
import db from './database.js';
import conn from './database.js';
const { urlencoded, json } = bodyParser;


const app = express();

//app.use(express.static('public'));

app.use(urlencoded({ extended: true }));
//app.use(express.urlencoded({ extended: true}));
app.use(json());
//app.use(express.json());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

let router = express.Router();

let initWebRoutes = (app) => {
  router.get("/", controller.test);

  router.get("/webhook", controller.getWebhook);
  router.post("/webhook", controller.postWebhook);

  router.get("/privacy", controller.privacy);

  return app.use("/", router);
};

initWebRoutes(app);

const messagecache = {};

function handleMessage(senderPsid, receivedMessage) {
  //let response;

  if (receivedMessage.text) {
    const fields = 'name';
    const url = `https://graph.facebook.com/${senderPsid}?fields=${fields}&access_token=${process.env.APP_TOKEN}`;
    let username = '';
    axios.get(url)
      .then(response => {
        //const data = JSON.parse(response.data);
        username = response.data.name;
        if (messagecache[senderPsid + receivedMessage.text]) {
          console.log('Message already processed');
          return;
        };
        const sql = 'INSERT INTO messages (sender_psid, message) VALUES (?, ?)';
        const values = [username, receivedMessage.text];

        conn.query(sql, values, (err, res) => {
          if (err) throw err;

          console.log('Message received and added to the database successfully!!!');
          messagecache[senderPsid + receivedMessage.text] = true;
        });
      })
      .catch(error => {
        console.error(error);
      });
  };

  /*if (receivedMessage.text) {
    response = {
      'text': 'You sent the message: ' + receivedMessage.text
    };
    console.log('You received the following message: ' + receivedMessage.text);
    
  } else if (receivedMessage.attachments) {

    let attachmentUrl = receivedMessage.attachments[0].payload.url;
    response = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': [{
            'title': 'Is this the right picture?',
            'subtitle': 'Tap a button to answer.',
            'image_url': attachmentUrl,
            'buttons': [
              {
                'type': 'postback',
                'title': 'Yes!',
                'payload': 'yes',
              },
              {
                'type': 'postback',
                'title': 'No!',
                'payload': 'no',
              }
            ],
          }]
        }
      }
    };
  }*/


  //callSendAPI(senderPsid, response);
};

function handlePostback(senderPsid, receivedPostback) {
  let response;


  let payload = receivedPostback.payload;


  if (payload === 'yes') {
    response = { 'text': 'Thanks!' };
  } else if (payload === 'no') {
    response = { 'text': 'Oops, try sending another image.' };
  }

  callSendAPI(senderPsid, response);
};

function callSendAPI(senderPsid, response) {

  let requestBody = {
    'recipient': {
      'id': senderPsid
    },
    'message': response
  };


  axios.post('https://graph.facebook.com/v2.6/me/messages?access_token=' + APP_TOKEN, requestBody)
    .then(() => {
      console.log('Message sent!');
    })
    .catch(error => {
      console.error('Unable to send message:', error);
    });

  /*request({
    'uri': 'https://graph.facebook.com/v2.6/me/messages',
    'qs': { 'access_token': APP_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, _res, _body) => {
    if (!err) {
      console.log('Message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });*/
};

export default {
  initWebRoutes: initWebRoutes,
  handleMessage: handleMessage,
  handlePostback: handlePostback,
  callSendAPI: callSendAPI
};

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

listener.timeout = 120000;