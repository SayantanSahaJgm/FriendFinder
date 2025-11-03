/**
 * Presence Badge Component
 * Shows a colored indicator for user's online status
 */

import React from 'react';
import { PresenceStatus } from '@/services/realtime/PresenceService';
import { cn } from '@/lib/utils';

interface PresenceBadgeProps {
  status: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

export function PresenceBadge({
  status,
  size = 'md',
  showPulse = true,
  className,
}: PresenceBadgeProps) {
  return (
    <div className={cn('relative inline-flex', className)}>
      <span
        className={cn(
          'rounded-full',
          sizeClasses[size],
          statusColors[status]
        )}
      />
      {showPulse && status === 'online' && (
        <span
          className={cn(
            'absolute top-0 left-0 rounded-full animate-ping',
            sizeClasses[size],
            'bg-green-500 opacity-75'
          )}
        />
      )}
    </div>
  );
}

export default PresenceBadge;
