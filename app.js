// Use dotenv to read .env vars into Node
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import express from 'express';
import controller from './controller.js';
import bodyParser from 'body-parser';
import conn from './database.js';
import cheerio from 'cheerio';
import querystring from 'querystring';
import { URL } from 'url';



const { urlencoded, json } = bodyParser;
const { APP_TOKEN, VERIFY_TOKEN, PORT } = process.env;

const app = express();

app.use(express.static('public'));

app.use(urlencoded({ extended: true }));
app.use(json());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const router = express.Router();

const initWebRoutes = (app) => {
  router.get("/", controller.test);

  router.get("/webhook", controller.getWebhook);
  router.post("/webhook", controller.postWebhook);

  router.get("/privacy", controller.privacy);
  router.get("/auth", controller.auth);
  router.get("/callback", controller.callback);

  return app.use("/", router);
};

initWebRoutes(app);

const messagecache = {};

const handleMessage = async (senderPsid, phone_number, receivedMessage) => {
  if (receivedMessage.text) {
    const fields = 'name';
    const url = `https://graph.facebook.com/${senderPsid}?fields=${fields}&access_token=${APP_TOKEN}`;
    let username = '';
    try {
      const response = await axios.get(url);
      username = response.data.name;
      if (messagecache[senderPsid + receivedMessage.text]) {
        console.log('Message already processed!!!');
        return;
      };
      const sql = 'INSERT INTO messages (name, phone_number, message) VALUES (?, ?, ?)';
      const values = [username, phone_number, receivedMessage.text];
      conn.query(sql, values, (err, res) => {
        if (err) console.error(err);
        console.log('Message received and added to the database successfully!!!');
        messagecache[senderPsid + receivedMessage.text] = true;
      });

    } catch (error) {
      console.error(error);
    };
    // trying to put data directly into boma crm system... currently incomplete:

    const session = axios.create({
      baseURL: 'https://www.bomamabati.co.ke/boma',
    });

    const loginData = {
      username: 'chris',
      password: 'chris@boma',
    };

    session.post('/login', loginData)
      .then(() => {
        // Navigate to the New Lead page
        return session.get('/crm/createweblead.php');
      }).then(response => {

        const formHtml = response.data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(formHtml, 'text/html');

        const form = doc.querySelector('form');

        const formData = {};
        const fields = form.querySelectorAll('input,textarea');
        fields.forEach(field => {
          formData[field.name] = field.value;
        });

        formData.fname = username;
        formData.mobile = phone_number;
        formData.email = "";
        formData.ltype = "";
        formData.mess = receivedMessage.text;


        /*
        const leadData = {
          name: `${username}`,
          //email: 'john.doe@example.com',
          //phone: '555-555-5555',
          message: `${receivedMessage.text}`
        };
        */

        const params = new URLSearchParams(formData).toString();

        const url = new URL('/saveweblead1.php', session.defaults.baseURL);
        return session.post(url.href, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        //return session.post('/crm/createweblead.php', leadData);

      /*}).then(() => {
        // Save the lead
        return session.post('/save_lead');
        */
      }).then(response => {
        console.log('Lead created successfully:', response.data);
      }).catch(error => {
        console.error('Error creating lead:', error);
      });

    //////END COMMENTS RIGHT HERE


  };
};



export default {
  initWebRoutes: initWebRoutes,
  handleMessage: handleMessage,
};

var listener = app.listen(PORT, (req, res) => {
  console.log('Your app is listening on port ' + listener.address().port);
});

listener.timeout = 120000;
