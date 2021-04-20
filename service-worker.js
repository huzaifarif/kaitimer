// service-worker.js
// listen to the install event
self.addEventListener('install', event => console.log('ServiceWorker installed'));

if (self.clients && (typeof self.clients.claim === 'function')) {
  self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
  });
}

self.addEventListener('push', event => {
  event.waitUntil(
    self.registration.showNotification('ServiceWorker Cookbook', {
      body: 'Yahoo!!',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.waitUntil(self.clients.matchAll().then(clients => {
    if (clients.length) { // check if at least one tab is already open
      clients[0].focus();
    } else {
      self.clients.openWindow('/');
    }
  }));
});

self.addEventListener('message', event => {
  if (!event.data) return;

  const { title, options, triggerAfterMS } = JSON.parse(event.data);
  setTimeout(() => {
    console.warn('triggering notif now!');
    self.registration.showNotification(title, options).then(ev => console.warn(ev));
  }, triggerAfterMS * 1000);

  // event.source.postMessage("Hi client");
});