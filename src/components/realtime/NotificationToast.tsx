/**
 * Notification Toast Component
 * Displays temporary notification toasts
 */

import React, { useEffect, useState } from 'react';
import { X, Bell, MessageSquare, UserPlus, MapPin, AlertCircle } from 'lucide-react';
import { Notification, NotificationType } from '@/services/realtime/NotificationHubService';
import { cn } from '@/lib/utils';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
  autoClose?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  friend_request: <UserPlus className="w-5 h-5" />,
  friend_accepted: <UserPlus className="w-5 h-5" />,
  message: <MessageSquare className="w-5 h-5" />,
  location_share: <MapPin className="w-5 h-5" />,
  nearby_friend: <MapPin className="w-5 h-5" />,
  system: <Bell className="w-5 h-5" />,
};

const typeColors: Record<NotificationType, string> = {
  friend_request: 'bg-blue-500',
  friend_accepted: 'bg-green-500',
  message: 'bg-purple-500',
  location_share: 'bg-orange-500',
  nearby_friend: 'bg-yellow-500',
  system: 'bg-gray-500',
};

export function NotificationToast({
  notification,
  onDismiss,
  autoClose = 5000,
  position = 'top-right',
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close timer
    if (autoClose > 0) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / autoClose) * 100);
        setProgress(remaining);

        if (remaining === 0) {
          clearInterval(timer);
          handleDismiss();
        }
      }, 50);

      return () => clearInterval(timer);
    }
  }, [autoClose]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for exit animation
  };

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300 ease-out',
        isVisible ? 'translate-x-0 translate-y-0 opacity-100' : 'opacity-0',
        position === 'top-right' && 'top-4 right-4',
        position === 'top-left' && 'top-4 left-4',
        position === 'bottom-right' && 'bottom-4 right-4',
        position === 'bottom-left' && 'bottom-4 left-4',
        position === 'top-center' && 'top-4 left-1/2 -translate-x-1/2',
        !isVisible && (
          position === 'top-right' || position === 'top-left'
            ? '-translate-y-full'
            : 'translate-y-full'
        )
      )}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden max-w-sm w-full">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={cn('rounded-full p-2 flex-shrink-0', typeColors[notification.type])}>
              <div className="text-white">
                {notification.icon ? (
                  <img src={notification.icon} alt="" className="w-5 h-5" />
                ) : (
                  typeIcons[notification.type]
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {notification.message}
              </p>

              {/* Action URL */}
              {notification.actionUrl && (
                <a
                  href={notification.actionUrl}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                  onClick={handleDismiss}
                >
                  View Details →
                </a>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {autoClose > 0 && (
          <div className="h-1 bg-gray-200 dark:bg-gray-700">
            <div
              className={cn('h-full transition-all duration-50 ease-linear', typeColors[notification.type])}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationToast;
