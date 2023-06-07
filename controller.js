import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import main from './app.js';
import bodyParser from 'body-parser';

const {urlencoded, json} = bodyParser;


const APP_TOKEN = process.env.APP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const app = express();

app.use(json());
app.use(urlencoded({ extended: true }));

app.use(express.static('public'));

let test = (req, res) => {
    res.sendFile('index.html');
}

let getWebhook = (req, res) => {

    //const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log(`WEBHOOK_VERIFIED. Challenge: ${challenge} `);
            res.send(challenge);
            //res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
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


        res.status(200).send('EVENT_RECEIVED');
    } else {


        res.sendStatus(404);
    }

};

export default {
    test: test,
    getWebhook: getWebhook,
    postWebhook: postWebhook
};