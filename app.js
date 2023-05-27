'use strict';

// Use dotenv to read .env vars into Node

import dotenv from 'dotenv';
dotenv.config();

//const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
//const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

import tokens from './config/tokens';
import https from 'https';
import http from 'http';
import fs from 'fs';
import request from 'request';
import express from 'express';
//import sampledataRouter from './routes/sample_data.js';
import pkg from 'body-parser';
const { urlencoded, json } = pkg;

const app = express();
var server = http.createServer(app);
server.listen(process.env.ALWAYSDATA_HTTPD_PORT, process.env.ALWAYSDATA_HTTPD_IP, function(){
  console.log("Server is started");
});

app.use(express.static('public'));



app.use(urlencoded({ extended: false }));


app.use(json());


app.get('/', function (_req, res) {
  res.sendFile(`${__dirname}/index.html`);
});



// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {


  //const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === tokens.VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});


app.post('/webhook', (req, res) => {
  console.log(req.body)

 
  if (body.object === 'page') {

   
    body.entry.forEach(function(entry) {

    
      let webhookEvent = entry.messaging[0];
      console.log(webhookEvent);

    
      let senderPsid = webhookEvent.sender.id;
      console.log('Sender PSID: ' + senderPsid);

      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });

    
    res.status(200).send('EVENT_RECEIVED');
  } else {

  
    res.sendStatus(404);
  }
});


function handleMessage(senderPsid, receivedMessage) {
  let response;

  
  if (receivedMessage.text) {
    
    response = {
      'text': `You sent the message: '${receivedMessage.text}'. Now send me an attachment!`
    };
    console.log(`You received the following message: ${receivedMessage.text}`);
    
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
  }

 
  callSendAPI(senderPsid, response);
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


  //const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  
  
  let requestBody = {
    'recipient': {
      'id': senderPsid
    },
    'message': response
  };

  
  request({
    'uri': 'https://graph.facebook.com/v2.6/me/messages',
    'qs': { 'access_token': tokens.APP_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, _res, _body) => {
    if (!err) {
      console.log('Message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });
};

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('csr.pem')
};

var ip = process.env.IP,
    PORT = process.env.PORT || 1337;

    app.listen(PORT, console.log(`Bot is running!!!`));

//https.createServer(options, app).listen(ip, PORT, console.log(`Bot is running on Port ${PORT}!!!`));
