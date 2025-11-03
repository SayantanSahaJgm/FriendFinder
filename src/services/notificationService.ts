/**
 * Notification Service
 * Handles push notifications and local notifications
 */

export interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  [key: string]: any;
}

export interface NotificationOptions {
  autoClose?: boolean;
  duration?: number;
  sound?: boolean;
  vibrate?: number[];
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Check notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined') {
    return 'denied';
  }

  if (!areNotificationsSupported()) {
    return 'denied';
  }

  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!areNotificationsSupported()) {
    console.warn('[NotificationService] Notifications not supported');
    return 'denied';
  }

  const current = getNotificationPermission();

  if (current === 'granted') {
    return 'granted';
  }

  if (current === 'denied') {
    console.warn('[NotificationService] Notification permission denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[NotificationService] Notification permission requested:', permission);
    return permission;
  } catch (error) {
    console.error('[NotificationService] Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Show local notification
 * This shows a notification via the service worker
 */
export async function showNotification(
  payload: NotificationPayload,
  options?: NotificationOptions
): Promise<void> {
  if (!areNotificationsSupported()) {
    console.warn('[NotificationService] Notifications not supported');
    return;
  }

  if (getNotificationPermission() !== 'granted') {
    console.warn('[NotificationService] Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if (!registration.active) {
      console.warn('[NotificationService] Service worker not active');
      return;
    }

    const notificationOptions = {
      icon: payload.icon || '/images/logo.png',
      badge: payload.badge || '/images/badge.png',
      tag: payload.tag || 'friendfinder-notification',
      requireInteraction: false,
      data: {
        url: payload.url || '/dashboard',
        timestamp: Date.now(),
        ...payload,
      },
    };

    await registration.showNotification(payload.title, {
      body: payload.body,
      ...notificationOptions,
    });

    console.log('[NotificationService] Notification shown:', payload.title);

    // Auto-close notification if requested
    if (options?.autoClose && options.duration) {
      setTimeout(() => {
        // Note: Service Worker will close it
      }, options.duration);
    }
  } catch (error) {
    console.error('[NotificationService] Failed to show notification:', error);
  }
}

/**
 * Show notification with sound and vibration
 */
export async function showAlertNotification(
  payload: NotificationPayload,
  options: NotificationOptions = {}
): Promise<void> {
  const notificationOptions: NotificationOptions = {
    sound: true,
    vibrate: [200, 100, 200],
    duration: 5000,
    ...options,
  };

  // Trigger vibration if supported
  if (notificationOptions.vibrate && 'vibrate' in navigator) {
    navigator.vibrate(notificationOptions.vibrate);
  }

  // Play sound if requested and not muted
  if (notificationOptions.sound) {
    playNotificationSound();
  }

  // Show notification
  await showNotification(payload, notificationOptions);
}

/**
 * Close all notifications
 */
export async function closeAllNotifications(): Promise<void> {
  if (!areNotificationsSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications();

    notifications.forEach((notification) => {
      notification.close();
    });

    console.log('[NotificationService] All notifications closed');
  } catch (error) {
    console.error('[NotificationService] Failed to close notifications:', error);
  }
}

/**
 * Close notification by tag
 */
export async function closeNotificationByTag(tag: string): Promise<void> {
  if (!areNotificationsSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({ tag });

    notifications.forEach((notification) => {
      notification.close();
    });

    console.log('[NotificationService] Notification closed:', tag);
  } catch (error) {
    console.error('[NotificationService] Failed to close notification:', error);
  }
}

/**
 * Get all active notifications
 */
export async function getActiveNotifications(): Promise<Notification[]> {
  if (!areNotificationsSupported()) {
    return [];
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.getNotifications();
  } catch (error) {
    console.error('[NotificationService] Failed to get notifications:', error);
    return [];
  }
}

/**
 * Play notification sound
 */
export function playNotificationSound(): void {
  try {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    console.log('[NotificationService] Notification sound played');
  } catch (error) {
    console.error('[NotificationService] Failed to play notification sound:', error);
  }
}

/**
 * Send notification to service worker for delivery
 * Useful for offline notifications
 */
export async function sendOfflineNotification(payload: NotificationPayload): Promise<void> {
  if (!areNotificationsSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if (registration.active) {
      registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload,
      });

      console.log('[NotificationService] Offline notification queued');
    }
  } catch (error) {
    console.error('[NotificationService] Failed to send offline notification:', error);
  }
}

/**
 * Listen for notification interactions
 */
export function onNotificationClick(
  callback: (notification: Notification) => void
): () => void {
  const handler = (event: Event) => {
    if (event instanceof MessageEvent && event.data?.type === 'NOTIFICATION_CLICK') {
      callback(event.data.notification);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('message', handler);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handler);
    }
  };
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(): (() => void) | null {
  if (!areNotificationsSupported()) {
    return null;
  }

  try {
    const unsubscribe1 = onNotificationClick((notification) => {
      console.log('[NotificationService] Notification clicked:', notification);
    });

    return () => {
      unsubscribe1();
    };
  } catch (error) {
    console.error('[NotificationService] Failed to setup notification listeners:', error);
    return null;
  }
}

/**
 * Test notification
 */
export async function showTestNotification(): Promise<void> {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    console.warn('[NotificationService] Cannot show test notification - permission denied');
    return;
  }

  await showNotification({
    title: 'FriendFinder',
    body: 'This is a test notification',
    url: '/dashboard',
  });
}

/**
 * Show friend request notification
 */
export async function showFriendRequestNotification(
  friendName: string,
  friendId: string
): Promise<void> {
  await showNotification({
    title: 'Friend Request',
    body: `${friendName} sent you a friend request`,
    icon: '/images/logo.png',
    tag: `friend-request-${friendId}`,
    url: `/dashboard?tab=friends`,
  });
}

/**
 * Show message notification
 */
export async function showMessageNotification(
  senderName: string,
  messagePreview: string,
  senderId: string
): Promise<void> {
  await showAlertNotification({
    title: `Message from ${senderName}`,
    body: messagePreview.substring(0, 100),
    icon: '/images/logo.png',
    tag: `message-${senderId}`,
    url: `/dashboard?chat=${senderId}`,
  });
}

/**
 * Show location update notification
 */
export async function showLocationNotification(friendName: string, friendId: string): Promise<void> {
  await showNotification({
    title: 'Location Update',
    body: `${friendName} shared their location`,
    icon: '/images/logo.png',
    tag: `location-${friendId}`,
    url: `/dashboard?tab=map`,
  });
}

/**
 * Show sync notification
 */
export async function showSyncNotification(
  status: 'start' | 'success' | 'error',
  details?: string
): Promise<void> {
  const titles = {
    start: 'Syncing...',
    success: 'Sync Complete',
    error: 'Sync Failed',
  };

  await showNotification({
    title: titles[status],
    body: details || `Offline sync ${status === 'success' ? 'completed' : status}`,
    icon: '/images/logo.png',
    tag: 'sync-notification',
  });
}

console.log('[NotificationService] Loaded');
