import dotenv from 'dotenv';
dotenv.config();
import twilio from 'twilio';
import express from 'express';
import bodyParser from 'body-parser';
const {urlencoded, json} = bodyParser;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const app = express();
app.use(urlencoded({extended: false}));
app.use(json());
const MessagingResponse = twilio.twiml.MessagingResponse;


app.post('/sms', (req, res) => {
  //gsm.decode(req.body.body);

  const myresponse = new MessagingResponse(client);
  console.log(`Incoming message from ${req.body.from}: ${req.body.body}`);
  
  
  client.messages
  .create({
     body: 'REV4TVQDEQ Confirmed. Ksh70.00 sent to ZURI GENESIS CO LTD for account 117 on 5/6/23 at 7:29AM. New M-PESA balance is Ksh1,029.76. Transaction cost, Ksh0.00. Amount you can transact within the day is 299,840.00. Buy business stock with M-PESA GlobalPay virtual Visa Card. Click on https://mpesaapp.page.link/GlobalPay',
     from: '+13025642305',
     to: '+254741105898'
   })
  .then(message => console.log(message.status));


  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(myresponse.toString());
});

var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port );
});



//response.redirect('/messaging');

//console.log(response.toString());