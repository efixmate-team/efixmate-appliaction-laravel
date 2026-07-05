"use client";

import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { firebaseApp } from './config';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

let _listenerActive = false;
let _userFcmDone = false;
let _techFcmDone = false;

function setupForegroundListener(messaging: Messaging): void {
  if (_listenerActive) return;
  _listenerActive = true;
  onMessage(messaging, async (payload) => {
    const title = payload.notification?.title ?? 'eFixMate';
    const body = payload.notification?.body ?? '';
    if (Notification.permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, { body, icon: '/favicon.ico' });
    } catch {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  });
}

export async function initUserFcm(): Promise<void> {
  if (_userFcmDone || typeof window === 'undefined') return;
  const supported = await isSupported();
  if (!supported) return;
  _userFcmDone = true;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;

    setupForegroundListener(messaging);

    await fetch(`${API_BASE}/user/home/device/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fcm_token: token }),
    });
  } catch (err) {
    console.debug('[FCM] User init error:', err);
    _userFcmDone = false;
  }
}

export async function initTechnicianFcm(bearerToken: string): Promise<void> {
  if (_techFcmDone || typeof window === 'undefined') return;
  const supported = await isSupported();
  if (!supported) return;
  _techFcmDone = true;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;

    setupForegroundListener(messaging);

    await fetch(`${API_BASE}/technician/home/device/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ fcm_token: token }),
    });
  } catch (err) {
    console.debug('[FCM] Technician init error:', err);
    _techFcmDone = false;
  }
}
