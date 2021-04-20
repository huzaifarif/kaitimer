// This function is needed because Chrome doesn't accept a base64 encoded string
// as value for applicationServerKey in pushManager.subscribe yet
// https://bugs.chromium.org/p/chromium/issues/detail?id=802280
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

function loadAds() {
  getKaiAd({
    publisher: '5436410d-9d88-4e92-9c74-6ab3257af0f7',
    app: 'kaitimer',
    slot: 'yourSlotName',

    // h: 264,
    // w: 240,

    // // Max supported size is 240x264
    // // container is required for responsive ads
    // container: document.getElementById('ad-container'),
    onerror: err => console.error('Custom catch:', err),
    onready: ad => {

      // Ad is ready to be displayed
      // calling 'display' will display the ad
      ad.call('display', {

        // In KaiOS the app developer is responsible
        // for user navigation, and can provide
        // navigational className and/or a tabindex
        tabindex: 0,

        // if the application is using
        // a classname to navigate
        // this classname will be applied
        // to the container
        navClass: 'items',

        // display style will be applied
        // to the container block or inline-block
        display: 'block',
      })
    }
  });
};

// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {

  // We'll ask the browser to use strict code to help us catch errors earlier.
  // https://developer.mozilla.org/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
  'use strict';

  loadAds();

  const baseURL = 'https://c01fdbab650e.ngrok.io';

  /** Register SW */
  const swUrl = `/service-worker.js`;
  navigator.serviceWorker.register(swUrl).then(reg => console.warn('Registeration done all good!', reg));

  /** Enable notifications */
  let notifAllowed = false;
  Notification.requestPermission().then(permission => {
    if (permission !== 'granted') {
      alert('you need to allow push notifications');
      return;
    }
    console.warn('Notification permission granted!');
    notifAllowed = true;
  });

  navigator.serviceWorker.ready.then(registration => {
    fetch(`${baseURL}/vapidPublicKey`)
      .then(response => response.text())
      .then(vapidPublicKey => {
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      }).then(subscription => {
        fetch(`${baseURL}/register`, {
          method: 'post',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            subscription: subscription
          }),
        });

        /** Add onclick listener to schedule notification */
        document.getElementById('startTimer').onclick = () => {
          navigator.serviceWorker.getRegistration().then(reg => {
            if (!reg) {
              console.warn('Service worker not registered');
              return;
            }
            if (!notifAllowed) return;

            const timeerVal = document.getElementById('timerInput').value;
            const timestamp = new Date().getTime() + (timeerVal * 1000);

            // Server push notification
            fetch(`${baseURL}/sendNotification`, {
              method: 'post',
              headers: {
                'Content-type': 'application/json'
              },
              body: JSON.stringify({
                subscription: subscription,
                delay: timeerVal,
                ttl: timeerVal * 1000,
              }),
            });

            // Local Notification
            // reg.active.postMessage(JSON.stringify({
            //   title: 'Demo Push Notification',
            //   options: {
            //     tag: timestamp, // a unique ID
            //     body: 'Hello World', // content of the push notification
            //     // showTrigger: new TimestampTrigger(timestamp), // set the time for the push notification
            //     data: {
            //       url: window.location.href, // pass the current url to the notification
            //     },
            //   },
            //   triggerAfterMS: timeerVal,
            // }));
          });
        };
      }).catch(err => console.warn(err));
    });
  });
});