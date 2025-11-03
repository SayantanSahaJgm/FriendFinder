/**
 * React hooks for notifications
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  notificationHubService,
  Notification,
  NotificationType,
  NotificationOptions,
} from '@/services/realtime/NotificationHubService';

/**
 * Hook to manage notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get initial notifications
    setNotifications(notificationHubService.getAllNotifications());
    setUnreadCount(notificationHubService.getUnreadCount());

    // Subscribe to new notifications
    const unsubscribeNotification = notificationHubService.onNotification((notification) => {
      setNotifications(notificationHubService.getAllNotifications());
    });

    // Subscribe to badge updates
    const unsubscribeBadge = notificationHubService.onBadgeUpdate((count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubscribeNotification();
      unsubscribeBadge();
    };
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    notificationHubService.markAsRead(notificationId);
    setNotifications(notificationHubService.getAllNotifications());
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationHubService.markAllAsRead();
    setNotifications(notificationHubService.getAllNotifications());
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    notificationHubService.deleteNotification(notificationId);
    setNotifications(notificationHubService.getAllNotifications());
  }, []);

  const clearAll = useCallback(() => {
    notificationHubService.clearAll();
    setNotifications([]);
  }, []);

  const unreadNotifications = useMemo(
    () => notifications.filter(n => !n.read),
    [notifications]
  );

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}

/**
 * Hook to create notifications
 */
export function useCreateNotification() {
  const createNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      options?: Partial<NotificationOptions & { data?: any; actionUrl?: string; icon?: string }>
    ) => {
      return notificationHubService.createNotification(type, title, message, options);
    },
    []
  );

  return createNotification;
}

/**
 * Hook to listen for new notifications
 */
export function useNotificationListener(callback: (notification: Notification) => void) {
  useEffect(() => {
    return notificationHubService.onNotification(callback);
  }, [callback]);
}

/**
 * Hook to get unread count
 */
export function useUnreadCount() {
  const [count, setCount] = useState(notificationHubService.getUnreadCount());

  useEffect(() => {
    return notificationHubService.onBadgeUpdate(setCount);
  }, []);

  return count;
}

/**
 * Hook to get notifications by type
 */
export function useNotificationsByType(type: NotificationType) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Get initial notifications
    setNotifications(notificationHubService.getNotificationsByType(type));

    // Subscribe to updates
    const unsubscribe = notificationHubService.onNotification(() => {
      setNotifications(notificationHubService.getNotificationsByType(type));
    });

    return unsubscribe;
  }, [type]);

  return notifications;
}

/**
 * Hook to initialize notification service
 */
export function useInitializeNotifications(userId: string | null) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!userId) return;

    notificationHubService.initialize(userId);
    setIsInitialized(true);

    return () => {
      notificationHubService.destroy();
      setIsInitialized(false);
    };
  }, [userId]);

  return isInitialized;
}

/**
 * Hook to get notification stats
 */
export function useNotificationStats() {
  const [stats, setStats] = useState(notificationHubService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(notificationHubService.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
