require('module-alias/register');
require('dotenv').config()
const amqp = require('amqplib')
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const NotificationAPI = require("@app/api/notification")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://production-mono.firebaseio.com",
})

async function receive(){
  // receive queue from rabbit MQ

  const conn = await amqp.connect(process.env.RABBITMQ_URL);

  try{
    // Publisher
    const ch = await conn.createChannel()
    
    ch.consume("sms.queue", (msg) => {
      // do send notification to mono
      const notification = JSON.parse(msg.content)
      NotificationAPI.sendSms(notification)
    }, {
      noAck: true
    })

  }catch(err){
    console.log(err.stack)
  }
}

receive();
