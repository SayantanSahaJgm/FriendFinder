/**
 * Notification Badge Component
 * Shows unread notification count badge
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dot';
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: 'min-w-[16px] h-4 text-[10px] px-1',
  md: 'min-w-[20px] h-5 text-xs px-1.5',
  lg: 'min-w-[24px] h-6 text-sm px-2',
};

const dotSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function NotificationBadge({
  count,
  max = 99,
  size = 'md',
  variant = 'default',
  className,
  children,
}: NotificationBadgeProps) {
  // Don't show badge if count is 0
  if (count === 0) {
    return <>{children}</>;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  if (variant === 'dot') {
    return (
      <div className={cn('relative inline-flex', className)}>
        {children}
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-900',
            dotSizeClasses[size]
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      <span
        className={cn(
          'absolute -top-1 -right-1 rounded-full bg-red-500 text-white font-semibold flex items-center justify-center border-2 border-white dark:border-gray-900',
          sizeClasses[size]
        )}
      >
        {displayCount}
      </span>
    </div>
  );
}

export default NotificationBadge;
