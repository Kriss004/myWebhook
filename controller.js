import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import main from './app.js';
import bodyParser from 'body-parser';
import path from 'path';
import passport from 'passport';
import FacebookStrategy from 'passport-facebook';
import FacebookTokenStrategy from 'passport-facebook-token';
import conn from './database.js';
import { info } from 'console';

const { urlencoded, json } = bodyParser;
const { APP_TOKEN, VERIFY_TOKEN, PORT } = process.env;

const app = express();

app.use(json());
app.use(urlencoded({ extended: true }));

app.use(passport.initialize());

passport.use(new FacebookTokenStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "https://bomatext.herokuapp.com/logincallback",
    profileFields: ['id','name', 'phone_number'],
    passReqToCallback: true
},
function(req, accessToken, refreshToken, profile, done){
    const name = profile.name;
    const phone_number = profile.phone_number;
    const facebook_id = profile.id;

    conn.query('SELECT * FROM users WHERE phone_number = ?', [phone_number], function(err, rows, fields) {
        if (err) { return done(err); }
        if (rows.length > 0) {
            const user = rows[0];
            conn.query('UPDATE users SET facebook_id = ?, facebook_token = ? WHERE id = ?', [facebook_id, accessToken, user.id], function(err, result) {
                if (err) { return done(err); }
                return done(null, user);
            });
        } else {
            conn.query('INSERT INTO users (name, phone_number, facebook_id, facebook_token) VALUES (?, ?, ?, ?)', [name, phone_number, facebook_id, accessToken], function(err, result) {
                if (err) { return done(err); }
                const userId = result.insertId;
                const newUser = {
                    id: userId,
                    name: name,
                    phone_number: phone_number,
                    facebook_id: facebook_id,
                    facebook_token: accessToken
                };
                return done(null, newUser);
            });
        }
    });

    //res.redirect('/messenger');
}));



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
            console.log(`Sender PSID: ${senderPsid}`);

            let phone_number = webhookEvent.sender.phone_number;
            console.log(`Phone number: ${phone_number}`);

            if (webhookEvent.message) {
                main.handleMessage(senderPsid, phone_number, webhookEvent.message);
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

//const auth = (passport.authenticate('facebook', {scope: ['public_profile', 'pages_messaging']}));

const auth = (req, res) => {
    passport.authenticate('facebook-token', { scope: ['public_profile', 'pages_messaging', 'pages_messaging_phone_number'], session: false }, (err, user, info) => {
        if (err) return res.status(400).send({ message: err.message });
        if (!user) return res.status(401).send({ message: 'Unauthorized' });
        req.user = user;
        res.redirect('/messenger');
     })(req, res);
     };



/*const callback = (passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/messenger');
});*/

const callback = (passport.authenticate('facebook-token', {session: false, failureRedirect: '/login'}), (req, res) => {
    res.redirect('/messenger');
});

export default {
    test: test,
    getWebhook: getWebhook,
    postWebhook: postWebhook,
    privacy: privacy,
    callback: callback,
    auth: auth
};