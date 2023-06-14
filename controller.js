import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import main from './app.js';
import bodyParser from 'body-parser';
import path from 'path';

const { urlencoded, json } = bodyParser;
const { APP_TOKEN, VERIFY_TOKEN, PORT } = process.env;

const app = express();

app.use(json());
app.use(urlencoded({ extended: true }));

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const test = (req, res) => {
    //res.send(`Welcome to my Facebook Webhook. It doesn't look like much, but it works.`);
    app.use(express.static('public'));
    const publicpath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(publicpath);
};

const getWebhook = (req, res) => {

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
};

const postWebhook = (req, res) => {

    console.log(`Received a ${req.method} request for ${req.url}`);
    console.log(`Request body: ${JSON.stringify(req.body)}`);

    if (!req.body || Object.keys(req.body).length === 0) {
        console.log('Received an empty request body');
        res.status(400).send('Bad Request: Request body is empty');
        return;
    }

    if (req.body.object === 'page') {
        req.body.entry.forEach(function (entry) {
            let webhookEvent = entry.messaging[0];
            console.log(webhookEvent);

            let senderPsid = webhookEvent.sender.id;
            console.log('Sender PSID: ' + senderPsid);

            if (webhookEvent.message) {
                main.handleMessage(senderPsid, webhookEvent.message);
                console.log('Message is: ' + webhookEvent.message.text);
            }
        });

        res.set('Cache-Control', 'public, max-age=12100');
        res.sendStatus(200);
    } else {

        res.sendStatus(404);
    }

};

const privacy = (req, res) => {
    app.use(express.static('public'));
    const priv = path.join(__dirname, 'privacy.html');
    res.sendFile(priv);

};

export default {
    test: test,
    getWebhook: getWebhook,
    postWebhook: postWebhook,
    privacy: privacy
};