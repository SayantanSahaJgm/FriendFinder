/**
 * useServiceWorker Hook
 * Manages service worker registration, updates, and lifecycle
 */

import { useEffect, useState, useCallback } from 'react';
import * as serviceWorkerUtils from '@/lib/serviceWorkerUtils';

export interface ServiceWorkerHookState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  error: string | null;
  registration: ServiceWorkerRegistration | null;
}

export interface UseServiceWorkerOptions {
  scriptPath?: string;
  vapidPublicKey?: string;
  autoUpdate?: boolean;
  onUpdateFound?: () => void;
  onControllerChange?: () => void;
}

/**
 * Hook for managing service worker lifecycle
 */
export function useServiceWorker(
  options: UseServiceWorkerOptions = {}
): ServiceWorkerHookState & {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  activateWaiting: () => Promise<void>;
  clearCache: () => Promise<void>;
  registerBackgroundSync: () => Promise<void>;
  subscribeToPush: () => Promise<void>;
} {
  const {
    scriptPath = '/sw.js',
    vapidPublicKey,
    autoUpdate = true,
    onUpdateFound,
    onControllerChange,
  } = options;

  const [state, setState] = useState<ServiceWorkerHookState>({
    isSupported: serviceWorkerUtils.isServiceWorkerSupported(),
    isRegistered: false,
    isUpdating: false,
    error: null,
    registration: null,
  });

  // Initialize service worker
  const register = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      const registration = await serviceWorkerUtils.registerServiceWorker(scriptPath, {
        onUpdateFound: () => {
          setState((prev) => ({ ...prev, isUpdating: true }));
          onUpdateFound?.();
        },
        onControllerChange: () => {
          setState((prev) => ({ ...prev, isUpdating: false }));
          onControllerChange?.();
        },
      });

      setState((prev) => ({
        ...prev,
        isRegistered: !!registration,
        registration: registration || null,
      }));

      // Try to subscribe to push notifications if key is provided
      if (vapidPublicKey) {
        try {
          await serviceWorkerUtils.subscribeToPushNotifications(vapidPublicKey);
        } catch (error) {
          console.error('[useServiceWorker] Failed to subscribe to push:', error);
        }
      }

      // Try to register background sync
      try {
        await serviceWorkerUtils.registerBackgroundSync();
      } catch (error) {
        console.error('[useServiceWorker] Failed to register background sync:', error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to register service worker';
      setState((prev) => ({ ...prev, error: errorMessage }));
      console.error('[useServiceWorker] Registration failed:', error);
    }
  }, [scriptPath, vapidPublicKey, onUpdateFound, onControllerChange]);

  // Unregister service worker
  const unregister = useCallback(async () => {
    try {
      await serviceWorkerUtils.unregisterServiceWorker(scriptPath);
      setState((prev) => ({
        ...prev,
        isRegistered: false,
        registration: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to unregister service worker';
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [scriptPath]);

  // Check for updates
  const update = useCallback(async () => {
    try {
      await serviceWorkerUtils.checkForServiceWorkerUpdate();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to check for updates';
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Activate waiting service worker
  const activateWaiting = useCallback(async () => {
    try {
      await serviceWorkerUtils.activateWaitingServiceWorker();
      // Don't force reload - let user refresh manually to avoid interrupting active sessions
      setState((prev) => ({ 
        ...prev, 
        updateAvailable: false,
        error: null
      }));
      // Show non-blocking notification instead
      console.log('✅ Service worker updated. Changes will apply on next page load.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to activate waiting service worker';
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await serviceWorkerUtils.clearServiceWorkerCache();
      setState((prev) => ({ ...prev, error: null }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear cache';
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Register background sync
  const registerBackgroundSync = useCallback(async () => {
    try {
      const success = await serviceWorkerUtils.registerBackgroundSync();
      if (!success) {
        setState((prev) => ({
          ...prev,
          error: 'Background Sync API not supported',
        }));
      } else {
        setState((prev) => ({ ...prev, error: null }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register sync';
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Subscribe to push
  const subscribeToPush = useCallback(async () => {
    if (!vapidPublicKey) {
      setState((prev) => ({
        ...prev,
        error: 'VAPID public key not provided',
      }));
      return;
    }

    try {
      const subscription = await serviceWorkerUtils.subscribeToPushNotifications(vapidPublicKey);
      if (!subscription) {
        setState((prev) => ({
          ...prev,
          error: 'Failed to subscribe to push notifications',
        }));
      } else {
        setState((prev) => ({ ...prev, error: null }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [vapidPublicKey]);

  // Auto-initialize on mount
  useEffect(() => {
    if (state.isSupported && !state.isRegistered) {
      register();
    }
  }, []); // Empty dependency array to run only once

  // Auto-update checks
  useEffect(() => {
    if (!autoUpdate || !state.isSupported) {
      return;
    }

    // Check for updates every 60 seconds
    const interval = setInterval(() => {
      update();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoUpdate, update, state.isSupported]);

  return {
    ...state,
    register,
    unregister,
    update,
    activateWaiting,
    clearCache,
    registerBackgroundSync,
    subscribeToPush,
  };
}

/**
 * Hook for listening to service worker background sync events
 */
export function useBackgroundSync(
  callback: (event: { type: string; tag?: string }) => void
): void {
  useEffect(() => {
    const unsubscribe = serviceWorkerUtils.listenForBackgroundSyncMessages(callback);
    return unsubscribe;
  }, [callback]);
}

console.log('[useServiceWorker] Hook loaded');
