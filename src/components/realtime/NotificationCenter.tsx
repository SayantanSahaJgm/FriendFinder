/**
 * Notification Center Component
 * Full notification panel with list and controls
 */

import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Filter } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/services/realtime/NotificationHubService';
import { NotificationBadge } from './NotificationBadge';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  className?: string;
}

const typeLabels: Record<NotificationType, string> = {
  friend_request: 'Friend Request',
  friend_accepted: 'Friend Accepted',
  message: 'Message',
  location_share: 'Location',
  nearby_friend: 'Nearby',
  system: 'System',
};

const typeColors: Record<NotificationType, string> = {
  friend_request: 'text-blue-600 bg-blue-100',
  friend_accepted: 'text-green-600 bg-green-100',
  message: 'text-purple-600 bg-purple-100',
  location_share: 'text-orange-600 bg-orange-100',
  nearby_friend: 'text-yellow-600 bg-yellow-100',
  system: 'text-gray-600 bg-gray-100',
};

export function NotificationCenter({
  isOpen,
  onClose,
  position = 'right',
  className,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (showUnreadOnly && n.read) return false;
    if (filterType !== 'all' && n.type !== filterType) return false;
    return true;
  });

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-out',
          position === 'right' ? 'right-0' : 'left-0',
          isOpen ? 'translate-x-0' : (position === 'right' ? 'translate-x-full' : '-translate-x-full'),
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <NotificationBadge count={unreadCount} size="sm" />
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
              <button
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800"
              >
                <option value="all">All Types</option>
                {Object.entries(typeLabels).map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="rounded"
                />
                Unread Only
              </label>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Bell className="w-12 h-12 mb-2" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      !notification.read && 'bg-blue-50 dark:bg-blue-900/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Badge */}
                      <div className={cn('rounded-full px-2 py-1 text-xs font-medium', typeColors[notification.type])}>
                        {typeLabels[notification.type]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>

                        {/* Action URL */}
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                          >
                            View Details →
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default NotificationCenter;
