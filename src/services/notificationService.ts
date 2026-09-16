export function supportsPhoneNotifications() {
  return 'Notification' in window && 'serviceWorker' in navigator;
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
