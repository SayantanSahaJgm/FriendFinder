/**
 * Presence Text Component
 * Shows formatted presence status text
 */

import React from 'react';
import { UserPresence } from '@/services/realtime/PresenceService';
import { useLastSeen } from '@/hooks/useRealtimePresence';
import { cn } from '@/lib/utils';

interface PresenceTextProps {
  presence: UserPresence | null;
  format?: 'full' | 'compact';
  className?: string;
}

const statusText = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
};

const statusColors = {
  online: 'text-green-600',
  away: 'text-yellow-600',
  offline: 'text-gray-500',
};

export function PresenceText({
  presence,
  format = 'full',
  className,
}: PresenceTextProps) {
  const lastSeen = useLastSeen(presence);

  if (!presence) {
    return (
      <span className={cn('text-sm text-gray-500', className)}>
        Unknown
      </span>
    );
  }

  if (format === 'compact') {
    return (
      <span className={cn('text-sm', statusColors[presence.status], className)}>
        {lastSeen || statusText[presence.status]}
      </span>
    );
  }

  // Full format
  if (presence.status === 'online') {
    return (
      <span className={cn('text-sm', statusColors.online, className)}>
        Online
      </span>
    );
  }

  if (presence.status === 'away') {
    return (
      <span className={cn('text-sm', statusColors.away, className)}>
        Away
      </span>
    );
  }

  // Offline - show last seen
  return (
    <span className={cn('text-sm text-gray-500', className)}>
      {lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
    </span>
  );
}

export default PresenceText;
