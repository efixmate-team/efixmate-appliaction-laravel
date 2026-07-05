importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDVh7dokQIu7bn7eg3Dq5f9ZqvpnO3gd9U",
  authDomain: "efixmate-pvt-ldt.firebaseapp.com",
  projectId: "efixmate-pvt-ldt",
  storageBucket: "efixmate-pvt-ldt.firebasestorage.app",
  messagingSenderId: "470843135280",
  appId: "1:470843135280:web:ca0f8e84542d422187e4f5",
  measurementId: "G-204XFVX1GF",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'eFixMate';
  const body = payload.notification?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
  });
});
