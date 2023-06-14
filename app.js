// Use dotenv to read .env vars into Node
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import express from 'express';
import controller from './controller.js';
import bodyParser from 'body-parser';
import conn from './database.js';


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

  return app.use("/", router);
};

initWebRoutes(app);

const messagecache = {};

const handleMessage = async (senderPsid, receivedMessage) => {
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
      const sql = 'INSERT INTO messages (sender_psid, message) VALUES (?, ?)';
      const values = [username, receivedMessage.text];
      conn.query(sql, values, (err, res) => {
        if (err) console.error(err);
        console.log('Message received and added to the database successfully!!!');
        messagecache[senderPsid + receivedMessage.text] = true;
      });

    } catch (error) {
      console.error(error);
    };
    // trying to put data directly into boma crm system... currently incomplete:
    /*
    const session = axios.create({
      baseURL: 'https://www.bomamabati.co.ke/boma/',
    });

    const loginData = {
      username: 'chris',
      password: 'chris@boma',
    };

    session.post('/login', loginData).then(() => {
      // Navigate to the New Lead page
      return session.get('/crm/createweblead.php');
    }).then(() => {
      
      const leadData = {
        name: `${username}`,
        //email: 'john.doe@example.com',
        //phone: '555-555-5555',
        message: `${receivedMessage.text}`
      };

      return session.post('/crm/createweblead.php', leadData);
    }).then(() => {
      // Save the lead
      return session.post('/save_lead');
    }).then(response => {
      console.log('Lead created successfully:', response.data);
    }).catch(error => {
      console.error('Error creating lead:', error);
    });
    
    //////END COMMENTS RIGHT HERE

    */
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
