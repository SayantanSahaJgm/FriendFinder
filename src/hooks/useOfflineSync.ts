'use client';

import { useState, useEffect, useCallback } from 'react';
import { networkStatusService, NetworkStatus } from '@/services/offlineSync/NetworkStatusService';
import { indexedDBService } from '@/services/offlineSync/IndexedDBService';
import { offlineSyncService, type SyncOperation, type SyncResult } from '@/services/offlineSync/OfflineSyncService';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  networkStatus: NetworkStatus;
  syncStatus: SyncStatus;
  queueLength: number;
  isInitialized: boolean;
  error: Error | null;
  // Actions
  initialize: () => Promise<void>;
  syncNow: () => Promise<SyncResult[]>;
  clearQueue: () => Promise<void>;
  getStorageInfo: () => Promise<{ usage: number; quota: number; percent: number }>;
  // Queue operations
  queueMessage: (payload: {
    receiverId: string;
    content: string;
    chatId?: string;
    timestamp?: number;
  }) => Promise<number>;
  queueFriendRequest: (toId: string) => Promise<number>;
  queueProfileUpdate: (updates: Record<string, any>) => Promise<number>;
  queueLocationUpdate: (location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
  }) => Promise<number>;
}

/**
 * Hook for managing offline sync state and operations
 * Provides network status, sync status, and queue management
 * Integrates with OfflineSyncService for real API calls
 */
export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [queueLength, setQueueLength] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize IndexedDB and network monitoring
   */
  const initialize = useCallback(async () => {
    try {
      // Initialize IndexedDB
      await indexedDBService.init();

      // Get initial queue length
      const length = await indexedDBService.getQueueLength();
      setQueueLength(length);

      setIsInitialized(true);
      console.log('[useOfflineSync] Initialized successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize offline sync');
      setError(error);
      console.error('[useOfflineSync] Initialization error:', error);
    }
  }, []);

  /**
   * Update queue length from IndexedDB
   */
  const updateQueueLength = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const length = await indexedDBService.getQueueLength();
      setQueueLength(length);
    } catch (err) {
      console.error('[useOfflineSync] Error updating queue length:', err);
    }
  }, [isInitialized]);

  /**
   * Sync all pending items in the queue using OfflineSyncService
   */
  const syncNow = useCallback(async (): Promise<SyncResult[]> => {
    if (!isInitialized || !isOnline || offlineSyncService.isSyncing()) {
      return [];
    }

    setSyncStatus('syncing');
    setError(null);

    try {
      console.log('[useOfflineSync] Starting sync via OfflineSyncService');
      const results = await offlineSyncService.syncAll();

      // Update queue length
      await updateQueueLength();

      // Determine overall status
      const failedCount = results.filter((r) => !r.success).length;
      if (failedCount === 0 && results.length > 0) {
        setSyncStatus('success');
        console.log(`[useOfflineSync] Sync completed successfully: ${results.length} items`);
      } else if (failedCount > 0) {
        setSyncStatus('error');
        console.log(
          `[useOfflineSync] Sync completed with errors: ${results.length - failedCount} success, ${failedCount} failed`
        );
      } else {
        setSyncStatus('idle');
      }

      // Reset to idle after 2 seconds
      setTimeout(() => setSyncStatus('idle'), 2000);

      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync failed');
      setError(error);
      setSyncStatus('error');
      console.error('[useOfflineSync] Sync error:', error);

      // Reset to idle after 2 seconds
      setTimeout(() => setSyncStatus('idle'), 2000);

      return [];
    }
  }, [isInitialized, isOnline, updateQueueLength]);

  /**
   * Clear all items from the queue
   */
  const clearQueue = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await offlineSyncService.clearQueue();
      setQueueLength(0);
      console.log('[useOfflineSync] Queue cleared');
    } catch (err) {
      console.error('[useOfflineSync] Error clearing queue:', err);
    }
  }, [isInitialized]);

  /**
   * Get storage usage information
   */
  const getStorageInfo = useCallback(async () => {
    if (!isInitialized) {
      return { usage: 0, quota: 0, percent: 0 };
    }

    return indexedDBService.getStorageEstimate();
  }, [isInitialized]);

  /**
   * Queue a message for offline sync
   */
  const queueMessage = useCallback(
    async (payload: {
      receiverId: string;
      content: string;
      chatId?: string;
      timestamp?: number;
    }) => {
      if (!isInitialized) {
        throw new Error('Offline sync not initialized');
      }
      const id = await offlineSyncService.queueMessage(payload);
      await updateQueueLength();
      return id;
    },
    [isInitialized, updateQueueLength]
  );

  /**
   * Queue a friend request for offline sync
   */
  const queueFriendRequest = useCallback(
    async (toId: string) => {
      if (!isInitialized) {
        throw new Error('Offline sync not initialized');
      }
      const id = await offlineSyncService.queueFriendRequest(toId);
      await updateQueueLength();
      return id;
    },
    [isInitialized, updateQueueLength]
  );

  /**
   * Queue a profile update for offline sync
   */
  const queueProfileUpdate = useCallback(
    async (updates: Record<string, any>) => {
      if (!isInitialized) {
        throw new Error('Offline sync not initialized');
      }
      const id = await offlineSyncService.queueProfileUpdate(updates);
      await updateQueueLength();
      return id;
    },
    [isInitialized, updateQueueLength]
  );

  /**
   * Queue a location update for offline sync
   */
  const queueLocationUpdate = useCallback(
    async (location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: number;
    }) => {
      if (!isInitialized) {
        throw new Error('Offline sync not initialized');
      }
      const id = await offlineSyncService.queueLocationUpdate(location);
      await updateQueueLength();
      return id;
    },
    [isInitialized, updateQueueLength]
  );

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initialize();

    return () => {
      // Cleanup if needed
    };
  }, [initialize]);

  /**
   * Subscribe to network status changes
   */
  useEffect(() => {
    const unsubscribe = networkStatusService.subscribe((status) => {
      setIsOnline(status.isOnline);
      setNetworkStatus(status);

      // Trigger sync when coming back online
      if (status.isOnline && queueLength > 0) {
        console.log('[useOfflineSync] Connection restored, triggering sync');
        syncNow();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queueLength, syncNow]);

  /**
   * Periodically update queue length
   */
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      updateQueueLength();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isInitialized, updateQueueLength]);

  /**
   * Subscribe to sync errors from OfflineSyncService
   */
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = offlineSyncService.onSyncError(({ operation, error: errorMsg }) => {
      console.error(`[useOfflineSync] Sync error for ${operation}:`, errorMsg);
      setError(new Error(`${operation} sync failed: ${errorMsg}`));
    });

    return () => unsubscribe();
  }, [isInitialized]);

  return {
    isOnline,
    networkStatus,
    syncStatus,
    queueLength,
    isInitialized,
    error,
    initialize,
    syncNow,
    clearQueue,
    getStorageInfo,
    queueMessage,
    queueFriendRequest,
    queueProfileUpdate,
    queueLocationUpdate,
  };
}
