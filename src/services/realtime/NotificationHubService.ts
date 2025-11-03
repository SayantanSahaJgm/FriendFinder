/**
 * Notification Hub Service
 * Handles real-time in-app notifications
 */

import { webSocketService } from './WebSocketService';

export type NotificationType = 
  | 'friend_request'
  | 'friend_accepted'
  | 'message'
  | 'location_share'
  | 'nearby_friend'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: number;
  read: boolean;
  data?: any;
  actionUrl?: string;
  icon?: string;
}

export interface NotificationOptions {
  sound?: boolean;
  vibrate?: boolean;
  persistent?: boolean;
  autoClose?: number; // milliseconds
}

type NotificationCallback = (notification: Notification) => void;
type BadgeUpdateCallback = (count: number) => void;

/**
 * Service for managing in-app notifications
 */
class NotificationHubService {
  private notifications: Map<string, Notification> = new Map();
  private notificationListeners: Set<NotificationCallback> = new Set();
  private badgeUpdateListeners: Set<BadgeUpdateCallback> = new Set();
  private currentUserId: string | null = null;
  private isInitialized = false;
  private unreadCount = 0;

  // Configuration
  private readonly MAX_NOTIFICATIONS = 100;
  private readonly AUTO_CLOSE_DURATION = 5000; // 5 seconds
  private readonly NOTIFICATION_RETENTION = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Default options
  private defaultOptions: NotificationOptions = {
    sound: true,
    vibrate: true,
    persistent: false,
    autoClose: this.AUTO_CLOSE_DURATION,
  };

  /**
   * Initialize the service
   */
  initialize(userId: string): void {
    if (this.isInitialized) return;

    this.currentUserId = userId;

    // Listen for notification events
    webSocketService.on('notification:new', this.handleNewNotification);
    webSocketService.on('notification:read', this.handleNotificationRead);
    webSocketService.on('notification:deleted', this.handleNotificationDeleted);
    webSocketService.on('notification:bulk', this.handleBulkNotifications);

    // Request existing notifications
    this.requestNotifications();

    this.isInitialized = true;
    console.log('[NotificationHub] Service initialized for user:', userId);
  }

  /**
   * Cleanup the service
   */
  destroy(): void {
    webSocketService.off('notification:new', this.handleNewNotification);
    webSocketService.off('notification:read', this.handleNotificationRead);
    webSocketService.off('notification:deleted', this.handleNotificationDeleted);
    webSocketService.off('notification:bulk', this.handleBulkNotifications);

    this.notifications.clear();
    this.notificationListeners.clear();
    this.badgeUpdateListeners.clear();

    this.isInitialized = false;
    console.log('[NotificationHub] Service destroyed');
  }

  // ==================== Notification Management ====================

  /**
   * Create and show a local notification
   */
  createNotification(
    type: NotificationType,
    title: string,
    message: string,
    options?: Partial<NotificationOptions & { data?: any; actionUrl?: string; icon?: string }>
  ): Notification {
    const notification: Notification = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      priority: 'normal',
      timestamp: Date.now(),
      read: false,
      data: options?.data,
      actionUrl: options?.actionUrl,
      icon: options?.icon,
    };

    this.addNotification(notification);
    this.showNotification(notification, options);

    return notification;
  }

  /**
   * Add notification to store
   */
  private addNotification(notification: Notification): void {
    // Remove old notifications if limit exceeded
    if (this.notifications.size >= this.MAX_NOTIFICATIONS) {
      const oldestId = Array.from(this.notifications.keys())[0];
      this.notifications.delete(oldestId);
    }

    this.notifications.set(notification.id, notification);

    if (!notification.read) {
      this.unreadCount++;
      this.notifyBadgeListeners();
    }
  }

  /**
   * Show notification (trigger sound, vibration, etc.)
   */
  private showNotification(
    notification: Notification,
    options?: Partial<NotificationOptions>
  ): void {
    const opts = { ...this.defaultOptions, ...options };

    // Trigger sound
    if (opts.sound) {
      this.playNotificationSound(notification.priority);
    }

    // Trigger vibration
    if (opts.vibrate && 'vibrate' in navigator) {
      this.triggerVibration(notification.priority);
    }

    // Notify listeners
    this.notifyListeners(notification);

    // Auto-close if not persistent
    if (!opts.persistent && opts.autoClose) {
      setTimeout(() => {
        // Don't auto-remove, just mark as shown
        console.log('[NotificationHub] Auto-close timeout for:', notification.id);
      }, opts.autoClose);
    }

    console.log('[NotificationHub] Notification shown:', notification.title);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.read) return;

    notification.read = true;
    this.notifications.set(notificationId, notification);

    this.unreadCount = Math.max(0, this.unreadCount - 1);
    this.notifyBadgeListeners();

    // Notify server
    webSocketService.emit('notification:mark_read', { notificationId });

    console.log('[NotificationHub] Marked as read:', notificationId);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    let count = 0;
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        count++;
      }
    });

    this.unreadCount = 0;
    this.notifyBadgeListeners();

    // Notify server
    webSocketService.emit('notification:mark_all_read', {});

    console.log('[NotificationHub] Marked all as read:', count);
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    if (!notification.read) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyBadgeListeners();
    }

    this.notifications.delete(notificationId);

    // Notify server
    webSocketService.emit('notification:delete', { notificationId });

    console.log('[NotificationHub] Deleted notification:', notificationId);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.clear();
    this.unreadCount = 0;
    this.notifyBadgeListeners();

    // Notify server
    webSocketService.emit('notification:clear_all', {});

    console.log('[NotificationHub] Cleared all notifications');
  }

  /**
   * Clear old notifications (older than retention period)
   */
  clearOldNotifications(): void {
    const now = Date.now();
    let cleared = 0;

    this.notifications.forEach((notification, id) => {
      if (now - notification.timestamp > this.NOTIFICATION_RETENTION) {
        if (!notification.read) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.notifications.delete(id);
        cleared++;
      }
    });

    if (cleared > 0) {
      this.notifyBadgeListeners();
      console.log('[NotificationHub] Cleared old notifications:', cleared);
    }
  }

  // ==================== Queries ====================

  /**
   * Get all notifications
   */
  getAllNotifications(): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.getAllNotifications().filter(n => !n.read);
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(type: NotificationType): Notification[] {
    return this.getAllNotifications().filter(n => n.type === type);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.unreadCount;
  }

  /**
   * Get notification by ID
   */
  getNotification(id: string): Notification | null {
    return this.notifications.get(id) || null;
  }

  /**
   * Request notifications from server
   */
  private requestNotifications(): void {
    webSocketService.emit('notification:request', {});
  }

  // ==================== Event Handlers ====================

  /**
   * Handle new notification from server
   */
  private handleNewNotification = (data: any) => {
    const notification: Notification = {
      id: data.id,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || 'normal',
      timestamp: data.timestamp || Date.now(),
      read: false,
      data: data.data,
      actionUrl: data.actionUrl,
      icon: data.icon,
    };

    this.addNotification(notification);
    this.showNotification(notification);

    console.log('[NotificationHub] New notification received:', notification.title);
  };

  /**
   * Handle notification read event
   */
  private handleNotificationRead = (data: any) => {
    const notification = this.notifications.get(data.notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyBadgeListeners();
    }
  };

  /**
   * Handle notification deleted event
   */
  private handleNotificationDeleted = (data: any) => {
    const notification = this.notifications.get(data.notificationId);
    if (notification) {
      if (!notification.read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notifyBadgeListeners();
      }
      this.notifications.delete(data.notificationId);
    }
  };

  /**
   * Handle bulk notifications
   */
  private handleBulkNotifications = (data: any) => {
    if (!Array.isArray(data.notifications)) return;

    data.notifications.forEach((n: any) => {
      const notification: Notification = {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        priority: n.priority || 'normal',
        timestamp: n.timestamp || Date.now(),
        read: n.read || false,
        data: n.data,
        actionUrl: n.actionUrl,
        icon: n.icon,
      };

      this.notifications.set(notification.id, notification);
      if (!notification.read) {
        this.unreadCount++;
      }
    });

    this.notifyBadgeListeners();
    console.log('[NotificationHub] Bulk notifications received:', data.notifications.length);
  };

  // ==================== Audio & Haptics ====================

  /**
   * Play notification sound
   */
  private playNotificationSound(priority: NotificationPriority): void {
    if (typeof Audio === 'undefined') return;

    try {
      // Different sounds for different priorities
      const soundFile = priority === 'urgent' || priority === 'high'
        ? '/sounds/notification-urgent.mp3'
        : '/sounds/notification.mp3';

      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch(err => {
        console.warn('[NotificationHub] Could not play sound:', err);
      });
    } catch (error) {
      console.warn('[NotificationHub] Audio not available:', error);
    }
  }

  /**
   * Trigger vibration
   */
  private triggerVibration(priority: NotificationPriority): void {
    try {
      const pattern = priority === 'urgent' || priority === 'high'
        ? [200, 100, 200] // Two strong vibrations
        : [100]; // Single short vibration

      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('[NotificationHub] Vibration not available:', error);
    }
  }

  // ==================== Listeners ====================

  /**
   * Notify notification listeners
   */
  private notifyListeners(notification: Notification): void {
    this.notificationListeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('[NotificationHub] Error in notification listener:', error);
      }
    });
  }

  /**
   * Notify badge update listeners
   */
  private notifyBadgeListeners(): void {
    this.badgeUpdateListeners.forEach(callback => {
      try {
        callback(this.unreadCount);
      } catch (error) {
        console.error('[NotificationHub] Error in badge listener:', error);
      }
    });
  }

  /**
   * Subscribe to new notifications
   */
  onNotification(callback: NotificationCallback): () => void {
    this.notificationListeners.add(callback);
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  /**
   * Subscribe to badge count updates
   */
  onBadgeUpdate(callback: BadgeUpdateCallback): () => void {
    this.badgeUpdateListeners.add(callback);
    // Call immediately with current count
    callback(this.unreadCount);
    return () => {
      this.badgeUpdateListeners.delete(callback);
    };
  }

  /**
   * Update default options
   */
  setDefaultOptions(options: Partial<NotificationOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      totalNotifications: this.notifications.size,
      unreadCount: this.unreadCount,
      notificationListeners: this.notificationListeners.size,
      badgeUpdateListeners: this.badgeUpdateListeners.size,
      currentUserId: this.currentUserId,
      isInitialized: this.isInitialized,
    };
  }
}

// Create singleton instance
export const notificationHubService = new NotificationHubService();

export default notificationHubService;
