import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import main from './app.js';
import bodyParser from 'body-parser';
import axios from 'axios';

const {urlencoded, json} = bodyParser;


const APP_TOKEN = process.env.APP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const app = express();

app.use(json());
app.use(urlencoded({ extended: true }));

app.use(express.static('public'));

let test = (req, res) => {
    //res.sendFile('index.ejs');
    res.send('Hello World!');
};

let getWebhook = (req, res) => {

    //const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {

        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {

            console.log(`WEBHOOK_VERIFIED. Challenge: ${challenge} `);
            res.status(200).send(challenge);

        } else {
            res.sendStatus(403);
        }
    };
    // Construct the API endpoint
    const apiEndpoint = `https://graph.facebook.com/v13.0/me/subscribed_apps?access_token=${process.env.APP_TOKEN}`;

    // Construct the POST request payload
    const payload = {
        object: 'page',
        callback_url: 'https://bomatext.herokuapp.com/webhook',
        subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins'],
        verify_token: 'myverifytoken'
    };

    // Send the POST request
    axios.post(apiEndpoint, payload)
        .then(response => {
            console.log('Webhook registered successfully.');
        })
        .catch(error => {
            console.error('Failed to register webhook. Error:', error.response.data);
        });
    
    axios.get(`https://graph.facebook.com/v13.0/123518010730211/subscribed_apps?access_token=${process.env.APP_TOKEN}`)
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.error('Failed to get subscription. Error:', error.response.data);
        });
    };

let postWebhook = (req, res) => {



    

    console.log(`Received a ${req.method} request for ${req.url}`);
    console.log(`Request body: ${JSON.stringify(req.body)}`);

    if (!req.body || Object.keys(req.body).length === 0) {
        console.log('Received an empty request body');
        res.status(400).send('Bad Request: Request body is empty');
        return;
    }

    //let body = req.body;


    if (req.body.object === 'page') {
        req.body.entry.forEach(function (entry) {
            let webhookEvent = entry.messaging[0];
            console.log(webhookEvent);

            let senderPsid = webhookEvent.sender.id;
            console.log('Sender PSID: ' + senderPsid);

            if (webhookEvent.message) {
                main.handleMessage(senderPsid, webhookEvent.message);
                console.log('Message is: ' + webhookEvent.message.text);
            } else if (webhookEvent.postback) {
                main.handlePostback(senderPsid, webhookEvent.postback);
                console.log('Postback is:'+ webhookEvent.postback);
            }
        });


        res.status(200);
    } else {


        res.sendStatus(404);
    }

};


export default {
    test: test,
    getWebhook: getWebhook,
    postWebhook: postWebhook
};