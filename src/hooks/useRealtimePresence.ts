/**
 * React hooks for real-time user presence
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { presenceService, UserPresence, PresenceStatus } from '@/services/realtime/PresenceService';

/**
 * Hook for tracking a single user's presence
 */
export function useRealtimePresence(userId: string) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial presence
    const initialPresence = presenceService.getPresence(userId);
    setPresence(initialPresence);
    setIsLoading(false);

    // Request fresh data
    if (!initialPresence) {
      presenceService.requestPresence([userId]);
    }

    // Subscribe to updates
    const unsubscribe = presenceService.onPresenceUpdate((updatedPresence) => {
      if (updatedPresence.userId === userId) {
        setPresence(updatedPresence);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [userId]);

  return {
    presence,
    isLoading,
    isOnline: presence?.status === 'online',
    isAway: presence?.status === 'away',
    isOffline: presence?.status === 'offline',
  };
}

/**
 * Hook for multiple users' presence
 */
export function useMultiplePresence(userIds: string[]) {
  const [presences, setPresences] = useState<Record<string, UserPresence>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial presences
    const initial: Record<string, UserPresence> = {};
    const missingIds: string[] = [];

    userIds.forEach(userId => {
      const presence = presenceService.getPresence(userId);
      if (presence) {
        initial[userId] = presence;
      } else {
        missingIds.push(userId);
      }
    });

    setPresences(initial);
    setIsLoading(false);

    // Request missing data
    if (missingIds.length > 0) {
      presenceService.requestPresence(missingIds);
    }

    // Subscribe to updates
    const unsubscribe = presenceService.onPresenceUpdate((presence) => {
      if (userIds.includes(presence.userId)) {
        setPresences(prev => ({
          ...prev,
          [presence.userId]: presence,
        }));
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [userIds.join(',')]);

  return {
    presences,
    isLoading,
  };
}

/**
 * Hook for current user's presence management
 */
export function useCurrentUserPresence(userId: string | null) {
  const [status, setStatus] = useState<PresenceStatus>('offline');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Initialize service
    presenceService.initialize(userId);
    setIsInitialized(true);

    // Get initial status
    const presence = presenceService.getPresence(userId);
    if (presence) {
      setStatus(presence.status);
    }

    // Subscribe to own updates
    const unsubscribe = presenceService.onPresenceUpdate((presence) => {
      if (presence.userId === userId) {
        setStatus(presence.status);
      }
    });

    return () => {
      unsubscribe();
      presenceService.destroy();
    };
  }, [userId]);

  const setUserStatus = useCallback((newStatus: PresenceStatus) => {
    presenceService.setStatus(newStatus);
    setStatus(newStatus);
  }, []);

  return {
    status,
    isInitialized,
    setStatus: setUserStatus,
    isOnline: status === 'online',
    isAway: status === 'away',
    isOffline: status === 'offline',
  };
}

/**
 * Hook to format last seen timestamp
 */
export function useLastSeen(presence: UserPresence | null): string {
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    if (!presence) {
      setFormattedTime('');
      return;
    }

    const updateTime = () => {
      setFormattedTime(formatLastSeen(presence));
    };

    // Update immediately
    updateTime();

    // Update every 10 seconds
    const interval = setInterval(updateTime, 10000);

    return () => clearInterval(interval);
  }, [presence]);

  return formattedTime;
}

/**
 * Format last seen timestamp
 */
export function formatLastSeen(presence: UserPresence | null): string {
  if (!presence) return '';

  if (presence.status === 'online') {
    return 'Online';
  }

  const now = Date.now();
  const diff = now - presence.lastSeen;

  // Less than 1 minute
  if (diff < 60 * 1000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}d ago`;
  }

  // More than 7 days
  const date = new Date(presence.lastSeen);
  return date.toLocaleDateString();
}

/**
 * Hook to get online users count
 */
export function useOnlineUsersCount(userIds: string[]) {
  const { presences } = useMultiplePresence(userIds);

  const onlineCount = useMemo(() => {
    return Object.values(presences).filter(p => p.status === 'online').length;
  }, [presences]);

  return onlineCount;
}

/**
 * Hook to get presence stats
 */
export function usePresenceStats() {
  const [stats, setStats] = useState(presenceService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(presenceService.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

/**
 * Hook to listen for any presence changes
 */
export function usePresenceUpdates(callback: (presence: UserPresence) => void) {
  useEffect(() => {
    return presenceService.onPresenceUpdate(callback);
  }, [callback]);
}

/**
 * Hook to listen for bulk presence changes
 */
export function useBulkPresenceUpdates(
  callback: (presences: Record<string, UserPresence>) => void
) {
  useEffect(() => {
    return presenceService.onBulkPresenceUpdate(callback);
  }, [callback]);
}
