/**
 * User Avatar with Presence Component
 * Shows user avatar with presence status indicator
 */

import React from 'react';
import Image from 'next/image';
import { PresenceStatus } from '@/services/realtime/PresenceService';
import { PresenceBadge } from './PresenceBadge';
import { cn } from '@/lib/utils';

interface UserAvatarWithPresenceProps {
  src?: string | null;
  alt: string;
  status?: PresenceStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPresence?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const presenceBadgeSizes = {
  sm: 'sm' as const,
  md: 'sm' as const,
  lg: 'md' as const,
  xl: 'md' as const,
};

const presenceBadgePositions = {
  sm: 'bottom-0 right-0',
  md: 'bottom-0 right-0',
  lg: 'bottom-0.5 right-0.5',
  xl: 'bottom-1 right-1',
};

export function UserAvatarWithPresence({
  src,
  alt,
  status,
  size = 'md',
  showPresence = true,
  className,
}: UserAvatarWithPresenceProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden bg-gray-200',
          sizeClasses[size]
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32}
            height={size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
            {alt.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {showPresence && status && (
        <div
          className={cn(
            'absolute ring-2 ring-white rounded-full',
            presenceBadgePositions[size]
          )}
        >
          <PresenceBadge
            status={status}
            size={presenceBadgeSizes[size]}
            showPulse={status === 'online'}
          />
        </div>
      )}
    </div>
  );
}

export default UserAvatarWithPresence;
