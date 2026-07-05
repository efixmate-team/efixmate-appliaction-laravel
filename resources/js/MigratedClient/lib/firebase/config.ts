import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDVh7dokQIu7bn7eg3Dq5f9ZqvpnO3gd9U",
  authDomain: "efixmate-pvt-ldt.firebaseapp.com",
  projectId: "efixmate-pvt-ldt",
  storageBucket: "efixmate-pvt-ldt.firebasestorage.app",
  messagingSenderId: "470843135280",
  appId: "1:470843135280:web:ca0f8e84542d422187e4f5",
  measurementId: "G-204XFVX1GF",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
