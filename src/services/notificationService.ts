import type { NotificationPreferences } from '../hooks/useNotificationPreferences';
import type { Json } from '../types/database';
import { getCurrentUserId } from './authService';
import { supabase } from './supabase';

const webPushPublicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? '';

async function requireCurrentUserId() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Sign in before connecting server push.');
  return userId;
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

export function supportsPhoneNotifications() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function isServerPushConfigured() {
  return Boolean(webPushPublicKey && supabase);
}

export async function getServerPushSubscription() {
  if (!supportsPhoneNotifications()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function connectServerPush(preferences: NotificationPreferences) {
  if (!supabase || !webPushPublicKey) throw new Error('Server push is not configured yet.');
  if (Notification.permission !== 'granted') throw new Error('Allow phone notifications first.');

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(webPushPublicKey),
  });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('The phone did not return a valid push subscription.');

  const userId = await requireCurrentUserId();
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Kigali',
    preferences: preferences as unknown as Json,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });
  if (error) throw error;
  return subscription;
}

export async function updateServerPushPreferences(preferences: NotificationPreferences) {
  if (!supabase) return;
  const subscription = await getServerPushSubscription();
  if (!subscription) return;
  const userId = await requireCurrentUserId();
  const { error } = await supabase.from('push_subscriptions').update({ preferences: preferences as unknown as Json, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('endpoint', subscription.endpoint);
  if (error) throw error;
}

export async function disconnectServerPush() {
  const subscription = await getServerPushSubscription();
  if (!subscription) return;
  if (supabase) {
    const userId = await requireCurrentUserId();
    await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', subscription.endpoint);
  }
  await subscription.unsubscribe();
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  return supportsPhoneNotifications() ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission() {
  if (!supportsPhoneNotifications()) return 'unsupported' as const;
  return Notification.requestPermission();
}

export async function showTestNotification(vibration: boolean) {
  if (!supportsPhoneNotifications() || Notification.permission !== 'granted') {
    throw new Error('Notifications are not allowed on this device.');
  }

  const registration = await navigator.serviceWorker.ready;
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: 'Phone notifications are ready. ENs can now remind you about executive priorities.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'ens-notification-test',
    data: { url: '/notifications' },
    vibrate: vibration ? [180, 80, 180] : undefined,
  };

  await registration.showNotification('ENs notifications enabled', options);
}
