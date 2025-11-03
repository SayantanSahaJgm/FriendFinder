/**
 * Service Worker Utilities
 * Handles registration, lifecycle, and communication with service worker
 */

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  error: string | null;
}

export interface ServiceWorkerRegistrationOptions {
  scope?: string;
  onUpdateFound?: (registration: ServiceWorkerRegistration) => void;
  onControllerChange?: () => void;
  onMessage?: (event: MessageEvent) => void;
}

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  scriptPath: string = '/sw.js',
  options: ServiceWorkerRegistrationOptions = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('[ServiceWorkerUtils] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(scriptPath, {
      scope: options.scope || '/',
    });

    console.log('[ServiceWorkerUtils] Service worker registered:', registration);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      console.log('[ServiceWorkerUtils] Service worker update found');
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker ready to activate
            console.log('[ServiceWorkerUtils] New service worker ready');
            options.onUpdateFound?.(registration);
          }
        });
      }
    });

    // Listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[ServiceWorkerUtils] Service worker controller changed');
      options.onControllerChange?.();
    });

    // Listen for messages from service worker
    if (options.onMessage) {
      navigator.serviceWorker.addEventListener('message', options.onMessage);
    }

    return registration;
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to register service worker:', error);
    throw error;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(
  scriptPath: string = '/sw.js'
): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(scriptPath);

    if (registration) {
      await registration.unregister();
      console.log('[ServiceWorkerUtils] Service worker unregistered');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to unregister service worker:', error);
    throw error;
  }
}

/**
 * Check if a new version of the service worker is available
 */
export async function checkForServiceWorkerUpdate(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[ServiceWorkerUtils] Checked for service worker updates');
    return true;
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to check for updates:', error);
    return false;
  }
}

/**
 * Activate a waiting service worker
 */
export async function activateWaitingServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const controller = navigator.serviceWorker.controller;

    if (controller) {
      controller.postMessage({ type: 'SKIP_WAITING' });
      console.log('[ServiceWorkerUtils] Sent SKIP_WAITING message to service worker');
    }
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to activate waiting service worker:', error);
    throw error;
  }
}

/**
 * Send message to service worker
 */
export async function postMessageToServiceWorker(
  message: Record<string, any>
): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if (registration.active) {
      registration.active.postMessage(message);
      console.log('[ServiceWorkerUtils] Message sent to service worker:', message.type);
    }
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to send message to service worker:', error);
    throw error;
  }
}

/**
 * Clear all service worker caches
 */
export async function clearServiceWorkerCache(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      console.log('[ServiceWorkerUtils] Cache cleared:', event.data.success);
      resolve(event.data.success);
    };

    postMessageToServiceWorker({
      type: 'CLEAR_CACHE',
    }).then(() => {
      const registration = navigator.serviceWorker.controller;
      if (registration) {
        registration.postMessage({ type: 'CLEAR_CACHE' }, [messageChannel.port2]);
      }
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      resolve(false);
    }, 5000);
  });
}

/**
 * Register for background sync
 */
export async function registerBackgroundSync(tag: string = 'offline-sync'): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    console.warn('[ServiceWorkerUtils] Service workers not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      console.log('[ServiceWorkerUtils] Background sync registered:', tag);
      return true;
    }

    console.warn('[ServiceWorkerUtils] Background Sync API not supported');
    return false;
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to register background sync:', error);
    return false;
  }
}

/**
 * Get the current service worker state
 */
export async function getServiceWorkerState(): Promise<ServiceWorkerState> {
  const state: ServiceWorkerState = {
    isSupported: isServiceWorkerSupported(),
    isRegistered: false,
    isUpdating: false,
    error: null,
  };

  if (!state.isSupported) {
    return state;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      state.isRegistered = true;
      state.isUpdating = !!registration.installing;
    }

    return state;
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Unknown error';
    return state;
  }
}

/**
 * Listen for background sync events (client side)
 * This listens for messages from the service worker about sync events
 */
export function listenForBackgroundSyncMessages(
  callback: (event: { type: string; tag?: string }) => void
): () => void {
  if (!isServiceWorkerSupported()) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'BACKGROUND_SYNC_START' || event.data?.type === 'PERIODIC_SYNC') {
      console.log('[ServiceWorkerUtils] Background sync message received:', event.data);
      callback(event.data);
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);

  // Return unsubscribe function
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[ServiceWorkerUtils] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return 'denied';
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('[ServiceWorkerUtils] Service workers not supported');
    return null;
  }

  try {
    // Request notification permission first
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      console.warn('[ServiceWorkerUtils] Notification permission denied');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    console.log('[ServiceWorkerUtils] Subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[ServiceWorkerUtils] Unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Get push notification subscription
 */
export async function getPushNotificationSubscription(): Promise<PushSubscription | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Initialize service worker with all features
 */
export async function initializeServiceWorker(options: {
  scriptPath?: string;
  vapidPublicKey?: string;
  onUpdateFound?: (registration: ServiceWorkerRegistration) => void;
  onControllerChange?: () => void;
}): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('[ServiceWorkerUtils] Service workers not supported');
    return null;
  }

  try {
    const registration = await registerServiceWorker(options.scriptPath, {
      onUpdateFound: options.onUpdateFound,
      onControllerChange: options.onControllerChange,
      onMessage: (event) => {
        const { data } = event;
        console.log('[ServiceWorkerUtils] Message from service worker:', data.type);
      },
    });

    // Try to register background sync
    await registerBackgroundSync();

    // Try to subscribe to push notifications if key is provided
    if (options.vapidPublicKey) {
      await subscribeToPushNotifications(options.vapidPublicKey);
    }

    return registration;
  } catch (error) {
    console.error('[ServiceWorkerUtils] Failed to initialize service worker:', error);
    throw error;
  }
}

console.log('[ServiceWorkerUtils] Loaded');
