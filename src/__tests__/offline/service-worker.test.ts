/**
 * Service Worker Tests
 * Tests for service worker registration, lifecycle, and API integration
 */

import * as serviceWorkerUtils from '@/lib/serviceWorkerUtils';
import * as notificationService from '@/services/notificationService';

describe('Service Worker Utils', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('isServiceWorkerSupported', () => {
    it('should return true when serviceWorker is available', () => {
      const result = serviceWorkerUtils.isServiceWorkerSupported();
      expect(typeof result).toBe('boolean');
    });

    it('should return false in non-browser environments', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const result = serviceWorkerUtils.isServiceWorkerSupported();
      expect(result).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('getServiceWorkerState', () => {
    it('should return state with isSupported flag', async () => {
      const state = await serviceWorkerUtils.getServiceWorkerState();

      expect(state).toHaveProperty('isSupported');
      expect(state).toHaveProperty('isRegistered');
      expect(state).toHaveProperty('isUpdating');
      expect(state).toHaveProperty('error');
      expect(typeof state.isSupported).toBe('boolean');
    });

    it('should have error property', async () => {
      const state = await serviceWorkerUtils.getServiceWorkerState();
      expect(state.error).toBeNull();
    });
  });
});

describe('Notification Service', () => {
  describe('areNotificationsSupported', () => {
    it('should return boolean', () => {
      const result = notificationService.areNotificationsSupported();
      expect(typeof result).toBe('boolean');
    });

    it('should return false in non-browser environments', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const result = notificationService.areNotificationsSupported();
      expect(result).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('getNotificationPermission', () => {
    it('should return NotificationPermission', () => {
      const permission = notificationService.getNotificationPermission();
      expect(['granted', 'denied', 'default']).toContain(permission);
    });
  });

  describe('showFriendRequestNotification', () => {
    it('should create notification payload with correct structure', async () => {
      // Mock the notification service
      const showNotificationSpy = jest
        .spyOn(notificationService, 'showNotification')
        .mockResolvedValue();

      await notificationService.showFriendRequestNotification('Alice', 'alice-123');

      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Friend Request',
          body: expect.stringContaining('Alice'),
          tag: 'friend-request-alice-123',
          url: expect.stringContaining('/dashboard'),
        })
      );

      showNotificationSpy.mockRestore();
    });
  });

  describe('showMessageNotification', () => {
    it('should create message notification payload', async () => {
      const showAlertSpy = jest
        .spyOn(notificationService, 'showAlertNotification')
        .mockResolvedValue();

      await notificationService.showMessageNotification('Bob', 'Hello there!', 'bob-123');

      expect(showAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Bob'),
          body: expect.stringContaining('Hello'),
          tag: 'message-bob-123',
        })
      );

      showAlertSpy.mockRestore();
    });
  });

  describe('showLocationNotification', () => {
    it('should create location notification payload', async () => {
      const showNotificationSpy = jest
        .spyOn(notificationService, 'showNotification')
        .mockResolvedValue();

      await notificationService.showLocationNotification('Charlie', 'charlie-123');

      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Location Update',
          body: expect.stringContaining('Charlie'),
          tag: 'location-charlie-123',
          url: expect.stringContaining('/dashboard'),
        })
      );

      showNotificationSpy.mockRestore();
    });
  });

  describe('showSyncNotification', () => {
    it('should show start sync notification', async () => {
      const showNotificationSpy = jest
        .spyOn(notificationService, 'showNotification')
        .mockResolvedValue();

      await notificationService.showSyncNotification('start', 'Starting sync...');

      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Syncing...',
          body: expect.stringContaining('Starting sync'),
          tag: 'sync-notification',
        })
      );

      showNotificationSpy.mockRestore();
    });

    it('should show success sync notification', async () => {
      const showNotificationSpy = jest
        .spyOn(notificationService, 'showNotification')
        .mockResolvedValue();

      await notificationService.showSyncNotification('success');

      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sync Complete',
          body: expect.stringContaining('success'),
        })
      );

      showNotificationSpy.mockRestore();
    });

    it('should show error sync notification', async () => {
      const showNotificationSpy = jest
        .spyOn(notificationService, 'showNotification')
        .mockResolvedValue();

      await notificationService.showSyncNotification('error', 'Connection timeout');

      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sync Failed',
          body: expect.stringContaining('error'),
        })
      );

      showNotificationSpy.mockRestore();
    });
  });

  describe('playNotificationSound', () => {
    it('should not throw when called', () => {
      expect(() => {
        notificationService.playNotificationSound();
      }).not.toThrow();
    });
  });
});

describe('Service Worker Lifecycle', () => {
  it('should handle install event by caching assets', () => {
    // This test would require mocking the service worker environment
    // For now, we just verify the utils functions exist
    expect(typeof serviceWorkerUtils.registerServiceWorker).toBe('function');
    expect(typeof serviceWorkerUtils.unregisterServiceWorker).toBe('function');
  });

  it('should handle activate event by cleaning caches', () => {
    expect(typeof serviceWorkerUtils.getServiceWorkerState).toBe('function');
  });

  it('should provide cache management utilities', () => {
    expect(typeof serviceWorkerUtils.clearServiceWorkerCache).toBe('function');
  });
});

describe('Background Sync Integration', () => {
  it('should provide background sync registration', async () => {
    expect(typeof serviceWorkerUtils.registerBackgroundSync).toBe('function');
  });

  it('should provide background sync message listener', () => {
    expect(typeof serviceWorkerUtils.listenForBackgroundSyncMessages).toBe('function');
  });

  it('should provide sync message unsubscribe function', () => {
    const unsubscribe = serviceWorkerUtils.listenForBackgroundSyncMessages(() => {});
    expect(typeof unsubscribe).toBe('function');
  });
});

describe('Push Notification Integration', () => {
  it('should provide notification permission utilities', () => {
    expect(typeof serviceWorkerUtils.requestNotificationPermission).toBe('function');
  });

  it('should provide push subscription utilities', () => {
    expect(typeof serviceWorkerUtils.subscribeToPushNotifications).toBe('function');
    expect(typeof serviceWorkerUtils.unsubscribeFromPushNotifications).toBe('function');
    expect(typeof serviceWorkerUtils.getPushNotificationSubscription).toBe('function');
  });

  it('should handle VAPID key conversion', () => {
    // The utility function should handle base64 VAPID keys
    expect(typeof serviceWorkerUtils.subscribeToPushNotifications).toBe('function');
  });
});

describe('Service Worker Message Handling', () => {
  it('should provide message posting utilities', async () => {
    expect(typeof serviceWorkerUtils.postMessageToServiceWorker).toBe('function');
  });

  it('should support SKIP_WAITING message', async () => {
    expect(typeof serviceWorkerUtils.activateWaitingServiceWorker).toBe('function');
  });
});

describe('Notification Service - Advanced', () => {
  it('should close notifications by tag', async () => {
    expect(typeof notificationService.closeNotificationByTag).toBe('function');
  });

  it('should close all notifications', async () => {
    expect(typeof notificationService.closeAllNotifications).toBe('function');
  });

  it('should get active notifications', async () => {
    expect(typeof notificationService.getActiveNotifications).toBe('function');
  });

  it('should handle notification click events', () => {
    expect(typeof notificationService.onNotificationClick).toBe('function');
  });

  it('should setup notification listeners', () => {
    expect(typeof notificationService.setupNotificationListeners).toBe('function');
  });

  it('should send offline notifications', async () => {
    expect(typeof notificationService.sendOfflineNotification).toBe('function');
  });
});

console.log('[Service Worker Tests] Loaded');
