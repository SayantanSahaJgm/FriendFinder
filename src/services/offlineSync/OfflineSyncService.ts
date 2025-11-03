import { indexedDBService, SyncQueueRecord } from './IndexedDBService';
import { networkStatusService } from './NetworkStatusService';

export type SyncOperation = 'message' | 'friendRequest' | 'profileUpdate' | 'locationUpdate';

export interface SyncResult {
  success: boolean;
  itemId: number;
  operation: SyncOperation;
  error?: string;
  retriesUsed?: number;
}

interface SyncConfig {
  maxRetries?: number;
  baseDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
}

/**
 * Core offline sync orchestrator
 * Manages sync queue, retry logic, and API calls
 */
class OfflineSyncService {
  private syncing = false;
  private syncListeners: Set<(status: { syncing: boolean; processed: number }) => void> = new Set();
  private errorListeners: Set<(error: { operation: SyncOperation; error: string }) => void> =
    new Set();
  private config: Required<SyncConfig>;

  // Sync handlers for different operation types
  private handlers: Record<
    SyncOperation,
    (payload: any, itemId: number) => Promise<void>
  > = {
    message: this.syncMessage.bind(this),
    friendRequest: this.syncFriendRequest.bind(this),
    profileUpdate: this.syncProfileUpdate.bind(this),
    locationUpdate: this.syncLocationUpdate.bind(this),
  };

  constructor(config: SyncConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 5,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
    };

    // Subscribe to network status changes
    if (typeof window !== 'undefined') {
      networkStatusService.subscribe((status) => {
        if (status.isOnline && !this.syncing) {
          console.log('[OfflineSync] Connection restored, triggering sync');
          this.syncAll();
        }
      });
    }
  }

  // ==================== Sync Operations ====================

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<SyncResult[]> {
    if (this.syncing) {
      console.log('[OfflineSync] Sync already in progress');
      return [];
    }

    if (!networkStatusService.isOnline()) {
      console.log('[OfflineSync] Cannot sync offline');
      return [];
    }

    this.syncing = true;
    const results: SyncResult[] = [];

    try {
      let processed = 0;

      while (true) {
        const item = await indexedDBService.getNextQueueItem();
        if (!item || !item.id) {
          break;
        }

        console.log(`[OfflineSync] Processing item ${item.id}: ${item.operation}`);

        try {
          // Mark as processing
          await indexedDBService.updateQueueItem(item.id, { status: 'processing' });

          // Get the handler for this operation
          const handler = this.handlers[item.operation];
          if (!handler) {
            throw new Error(`Unknown operation: ${item.operation}`);
          }

          // Execute the sync
          await handler(item.payload, item.id);

          // Mark as completed
          await indexedDBService.updateQueueItem(item.id, { status: 'completed' });

          results.push({
            success: true,
            itemId: item.id,
            operation: item.operation,
            retriesUsed: item.retryCount,
          });

          console.log(`[OfflineSync] Item ${item.id} synced successfully`);
          processed++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[OfflineSync] Failed to sync item ${item.id}:`, errorMsg);

          const newRetryCount = item.retryCount + 1;

          if (newRetryCount >= this.config.maxRetries) {
            // Max retries exceeded, mark as failed
            await indexedDBService.updateQueueItem(item.id, {
              status: 'failed',
              retryCount: newRetryCount,
            });

            results.push({
              success: false,
              itemId: item.id,
              operation: item.operation,
              error: errorMsg,
              retriesUsed: newRetryCount,
            });

            this.notifyError(item.operation, errorMsg);
          } else {
            // Retry later
            const delay = this.calculateBackoffDelay(newRetryCount);
            await indexedDBService.updateQueueItem(item.id, {
              status: 'pending',
              retryCount: newRetryCount,
            });

            console.log(
              `[OfflineSync] Item ${item.id} will retry in ${delay}ms (attempt ${newRetryCount}/${this.config.maxRetries})`
            );

            results.push({
              success: false,
              itemId: item.id,
              operation: item.operation,
              error: `Will retry in ${delay}ms`,
              retriesUsed: newRetryCount,
            });

            // Stop processing to avoid hammering the server
            break;
          }
        }
      }

      // Clear completed items
      await indexedDBService.clearCompletedQueue();

      console.log(`[OfflineSync] Sync completed: ${results.length} items processed`);
      this.notifySyncStatus(false, results.length);

      return results;
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    return this.syncing;
  }

  // ==================== Sync Handlers ====================

  /**
   * Sync a message (REST API call)
   */
  private async syncMessage(payload: any, itemId: number): Promise<void> {
    const { receiverId, content, chatId, timestamp } = payload;

    if (!receiverId || !content) {
      throw new Error('Invalid message payload');
    }

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiverId,
        content,
        chatId,
        timestamp,
        offlineQueueId: itemId, // Track sync origin
      }),
    });

    if (!response.ok) {
      throw new Error(`Message sync failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Message sync failed');
    }

    // Store the server message ID for reference
    await indexedDBService.setMetadata(`message_${itemId}_serverId`, data.data.messageId);
  }

  /**
   * Sync a friend request (REST API call)
   */
  private async syncFriendRequest(payload: any, itemId: number): Promise<void> {
    const { toId } = payload;

    if (!toId) {
      throw new Error('Invalid friend request payload');
    }

    const response = await fetch('/api/friends/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toId,
        offlineQueueId: itemId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Friend request sync failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Friend request sync failed');
    }
  }

  /**
   * Sync a profile update (REST API call)
   */
  private async syncProfileUpdate(payload: any, itemId: number): Promise<void> {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        offlineQueueId: itemId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Profile sync failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Profile sync failed');
    }
  }

  /**
   * Sync a location update (REST API call)
   */
  private async syncLocationUpdate(payload: any, itemId: number): Promise<void> {
    const response = await fetch('/api/location/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        offlineQueueId: itemId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Location sync failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Location sync failed');
    }
  }

  // ==================== Queue Management ====================

  /**
   * Queue a message for sync
   */
  async queueMessage(payload: {
    receiverId: string;
    content: string;
    chatId?: string;
    timestamp?: number;
  }): Promise<number> {
    return indexedDBService.addToQueue({
      operation: 'message',
      payload: {
        ...payload,
        timestamp: payload.timestamp || Date.now(),
      },
      priority: 1, // Messages are high priority
    });
  }

  /**
   * Queue a friend request for sync
   */
  async queueFriendRequest(toId: string): Promise<number> {
    return indexedDBService.addToQueue({
      operation: 'friendRequest',
      payload: { toId },
      priority: 2, // Normal priority
    });
  }

  /**
   * Queue a profile update for sync
   */
  async queueProfileUpdate(updates: Record<string, any>): Promise<number> {
    return indexedDBService.addToQueue({
      operation: 'profileUpdate',
      payload: updates,
      priority: 3, // Low priority
    });
  }

  /**
   * Queue a location update for sync
   */
  async queueLocationUpdate(location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
  }): Promise<number> {
    return indexedDBService.addToQueue({
      operation: 'locationUpdate',
      payload: {
        ...location,
        timestamp: location.timestamp || Date.now(),
      },
      priority: 2, // Normal priority
    });
  }

  /**
   * Get pending items count
   */
  async getPendingCount(): Promise<number> {
    return indexedDBService.getQueueLength();
  }

  /**
   * Clear all queued items
   */
  async clearQueue(): Promise<void> {
    const allItems = await indexedDBService.getQueueItems();
    for (const item of allItems) {
      if (item.id) {
        await indexedDBService.removeFromQueue(item.id);
      }
    }
    console.log('[OfflineSync] Queue cleared');
  }

  // ==================== Retry Logic ====================

  /**
   * Calculate exponential backoff delay
   * Formula: min(baseDelay * 2^retryCount, maxDelay) + random jitter
   */
  private calculateBackoffDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
    const exponential = this.config.baseDelay * Math.pow(2, retryCount - 1);
    const capped = Math.min(exponential, this.config.maxDelay);

    // Add random jitter (±20%)
    const jitter = capped * 0.2 * (Math.random() - 0.5);
    return Math.max(this.config.baseDelay, capped + jitter);
  }

  // ==================== Event Listeners ====================

  /**
   * Subscribe to sync status changes
   */
  onSyncStatus(listener: (status: { syncing: boolean; processed: number }) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Subscribe to sync errors
   */
  onSyncError(
    listener: (error: { operation: SyncOperation; error: string }) => void
  ): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Notify sync status subscribers
   */
  private notifySyncStatus(syncing: boolean, processed: number): void {
    this.syncListeners.forEach((listener) => {
      try {
        listener({ syncing, processed });
      } catch (error) {
        console.error('[OfflineSync] Error in sync status listener:', error);
      }
    });
  }

  /**
   * Notify error subscribers
   */
  private notifyError(operation: SyncOperation, error: string): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener({ operation, error });
      } catch (err) {
        console.error('[OfflineSync] Error in error listener:', err);
      }
    });
  }

  // ==================== Cleanup ====================

  /**
   * Cleanup and disconnect
   */
  destroy(): void {
    this.syncListeners.clear();
    this.errorListeners.clear();
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService({
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
});

export default offlineSyncService;
