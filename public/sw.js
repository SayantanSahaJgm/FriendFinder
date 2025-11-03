// Service Worker for FriendFinder
// Handles offline caching, background sync, and push notifications

const CACHE_VERSION = 'v1';
const CACHE_NAME = `friendfinder-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/styles/globals.css',
  '/images/logo.png',
  '/manifest.json',
];

// ==================== Installation ====================

/**
 * Install event: cache assets for offline use
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );

  // Force the waiting service worker to become active
  self.skipWaiting();
});

// ==================== Activation ====================

/**
 * Activate event: clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages
  self.clients.claim();
});

// ==================== Fetch Handling ====================

/**
 * Fetch event: serve from cache, fallback to network
 * Strategy: Cache first for assets, Network first for API calls
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API calls: Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Assets: Cache first, fallback to network
  if (isAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages: Network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
});

/**
 * Network first strategy
 * Try network, fallback to cache
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, checking cache:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigate requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }

    return new Response('Service Unavailable', { status: 503 });
  }
}

/**
 * Cache first strategy
 * Try cache, fallback to network
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[ServiceWorker] Cache and network both failed:', request.url);
    return new Response('Service Unavailable', { status: 503 });
  }
}

/**
 * Check if URL is an asset
 */
function isAsset(pathname) {
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot')
  );
}

// ==================== Background Sync ====================

/**
 * Background Sync: Sync queued items when online
 * Tag: 'offline-sync'
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    console.log('[ServiceWorker] Background sync triggered:', event.tag);

    event.waitUntil(
      // Signal to client that background sync is happening
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'BACKGROUND_SYNC_START',
            tag: event.tag,
          });
        });
      })
    );
  }
});

/**
 * Periodic Sync: Sync at regular intervals (browser dependent)
 * Tag: 'offline-sync-periodic'
 * Note: iOS does not support periodic sync
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'offline-sync-periodic') {
    console.log('[ServiceWorker] Periodic sync triggered:', event.tag);

    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PERIODIC_SYNC',
            tag: event.tag,
          });
        });
      })
    );
  }
});

// ==================== Push Notifications ====================

/**
 * Push event: Show notification when message arrives
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');

  const options = {
    icon: '/images/logo.png',
    badge: '/images/badge.png',
    tag: 'friendfinder-notification',
    requireInteraction: false,
  };

  try {
    const data = event.data?.json() || {};

    event.waitUntil(
      self.registration.showNotification(data.title || 'FriendFinder', {
        body: data.body || 'You have a new message',
        ...options,
        data: {
          url: data.url || '/dashboard',
          ...data,
        },
      })
    );
  } catch (error) {
    console.error('[ServiceWorker] Failed to handle push:', error);

    event.waitUntil(
      self.registration.showNotification('FriendFinder', {
        body: 'You have a new notification',
        ...options,
      })
    );
  }
});

/**
 * Notification click event: Open relevant page
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

/**
 * Notification close event: Handle notification dismissal
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[ServiceWorker] Notification dismissed');
});

// ==================== Message Handling ====================

/**
 * Message event: Handle messages from clients
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  console.log('[ServiceWorker] Message received:', type);

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      clearCache().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'TRIGGER_SYNC':
      triggerBackgroundSync();
      break;

    default:
      console.log('[ServiceWorker] Unknown message type:', type);
  }
});

/**
 * Clear all caches
 */
async function clearCache() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map((name) => caches.delete(name)));
}

/**
 * Trigger background sync programmatically
 */
async function triggerBackgroundSync() {
  try {
    if ('sync' in self.registration) {
      await self.registration.sync.register('offline-sync');
      console.log('[ServiceWorker] Background sync registered');
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to register background sync:', error);
  }
}

console.log('[ServiceWorker] Loaded successfully');
