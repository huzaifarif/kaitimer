const webPush = require('web-push');
const express = require('express');
const cors = require('cors');

process.env.VAPID_PUBLIC_KEY = 'BHeXL3f8oJJ9ymsWY2s_dK1qx1-AswCAvitiUBqMklh6tiajbZoDa8f_75OyHippqey0BukZEwFqdLEFMmHy2Vk';
process.env.VAPID_PRIVATE_KEY = '6v5TP2Ou9zbWTweRL4NjXHnQRq6yne08NlEEdTMu7N0';

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log("You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
    "environment variables. You can use the following ones:");
  console.log(webPush.generateVAPIDKeys());
  return;
}

webPush.setVapidDetails(
  'mailto:huzefa.a@proximity.tech',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

app.get('/vapidPublicKey', function (req, res) {
  res.send(process.env.VAPID_PUBLIC_KEY);
});

app.post('/register', function (req, res) {
  res.sendStatus(201);
});

app.post('/sendNotification', function (req, res) {
  const subscription = req.body.subscription;
  const payload = null;
  const options = {
    TTL: req.body.ttl
  };

  setTimeout(function () {
    webPush.sendNotification(subscription, payload, options)
      .then(function () {
      })
      .catch(function (error) {
        console.log(error);
      });
  }, req.body.delay * 1000);

  res.sendStatus(201);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}!`)
});