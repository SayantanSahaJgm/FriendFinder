import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema types
interface FriendFinderDB extends DBSchema {
  messages: {
    key: string;
    value: {
      id: string;
      chatId: string;
      senderId: string;
      receiverId: string;
      content: string;
      timestamp: number;
      status: 'pending' | 'synced' | 'failed';
      retryCount: number;
      lastAttempt?: number;
    };
    indexes: { 'by-chatId': string; 'by-status': string };
  };
  friendRequests: {
    key: string;
    value: {
      id: string;
      fromId: string;
      toId: string;
      status: 'pending' | 'synced' | 'failed';
      timestamp: number;
      retryCount: number;
    };
    indexes: { 'by-status': string };
  };
  userCache: {
    key: string;
    value: {
      userId: string;
      username: string;
      profileData: Record<string, any>;
      lastFetched: number;
      expiresAt: number;
    };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      operation: 'message' | 'friendRequest' | 'profileUpdate' | 'locationUpdate';
      payload: any;
      priority: 1 | 2 | 3; // 1=high, 2=normal, 3=low
      createdAt: number;
      status: 'pending' | 'processing' | 'failed' | 'completed';
      retryCount: number;
    };
    indexes: { 'by-status': string; 'by-priority': number };
  };
  syncMetadata: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
  };
}

export type MessageRecord = FriendFinderDB['messages']['value'];
export type FriendRequestRecord = FriendFinderDB['friendRequests']['value'];
export type UserCacheRecord = FriendFinderDB['userCache']['value'];
export type SyncQueueRecord = FriendFinderDB['syncQueue']['value'];
export type SyncMetadataRecord = FriendFinderDB['syncMetadata']['value'];

const DB_NAME = 'friendfinder_offline_v1';
const DB_VERSION = 1;

/**
 * IndexedDB Service for offline data persistence
 * Manages messages, friend requests, user cache, sync queue, and metadata
 */
class IndexedDBService {
  private db: IDBPDatabase<FriendFinderDB> | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.db = await openDB<FriendFinderDB>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Messages store
            if (!db.objectStoreNames.contains('messages')) {
              const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
              messageStore.createIndex('by-chatId', 'chatId');
              messageStore.createIndex('by-status', 'status');
            }

            // Friend Requests store
            if (!db.objectStoreNames.contains('friendRequests')) {
              const friendRequestStore = db.createObjectStore('friendRequests', { keyPath: 'id' });
              friendRequestStore.createIndex('by-status', 'status');
            }

            // User Cache store
            if (!db.objectStoreNames.contains('userCache')) {
              db.createObjectStore('userCache', { keyPath: 'userId' });
            }

            // Sync Queue store
            if (!db.objectStoreNames.contains('syncQueue')) {
              const syncQueueStore = db.createObjectStore('syncQueue', {
                keyPath: 'id',
                autoIncrement: true,
              });
              syncQueueStore.createIndex('by-status', 'status');
              syncQueueStore.createIndex('by-priority', 'priority');
            }

            // Sync Metadata store
            if (!db.objectStoreNames.contains('syncMetadata')) {
              db.createObjectStore('syncMetadata', { keyPath: 'key' });
            }
          },
        });

        console.log('[IndexedDB] Database initialized successfully');
      } catch (error) {
        console.error('[IndexedDB] Failed to initialize database:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBPDatabase<FriendFinderDB>> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ==================== Message Operations ====================

  /**
   * Add a message to offline storage
   */
  async addMessage(message: Omit<MessageRecord, 'retryCount' | 'status'>): Promise<void> {
    const db = await this.ensureDB();
    const messageWithDefaults: MessageRecord = {
      ...message,
      status: 'pending',
      retryCount: 0,
    };
    await db.add('messages', messageWithDefaults);
    console.log('[IndexedDB] Message added:', message.id);
  }

  /**
   * Get a message by ID
   */
  async getMessage(id: string): Promise<MessageRecord | undefined> {
    const db = await this.ensureDB();
    return db.get('messages', id);
  }

  /**
   * Update a message
   */
  async updateMessage(id: string, updates: Partial<MessageRecord>): Promise<void> {
    const db = await this.ensureDB();
    const message = await db.get('messages', id);
    if (message) {
      const updated = { ...message, ...updates };
      await db.put('messages', updated);
      console.log('[IndexedDB] Message updated:', id);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('messages', id);
    console.log('[IndexedDB] Message deleted:', id);
  }

  /**
   * Get all messages for a chat
   */
  async getAllMessages(chatId: string): Promise<MessageRecord[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('messages', 'by-chatId', chatId);
  }

  /**
   * Get messages by status
   */
  async getMessagesByStatus(status: MessageRecord['status']): Promise<MessageRecord[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('messages', 'by-status', status);
  }

  // ==================== Friend Request Operations ====================

  /**
   * Add a friend request to offline storage
   */
  async addFriendRequest(request: Omit<FriendRequestRecord, 'retryCount' | 'status'>): Promise<void> {
    const db = await this.ensureDB();
    const requestWithDefaults: FriendRequestRecord = {
      ...request,
      status: 'pending',
      retryCount: 0,
    };
    await db.add('friendRequests', requestWithDefaults);
    console.log('[IndexedDB] Friend request added:', request.id);
  }

  /**
   * Update a friend request
   */
  async updateFriendRequest(id: string, updates: Partial<FriendRequestRecord>): Promise<void> {
    const db = await this.ensureDB();
    const request = await db.get('friendRequests', id);
    if (request) {
      const updated = { ...request, ...updates };
      await db.put('friendRequests', updated);
      console.log('[IndexedDB] Friend request updated:', id);
    }
  }

  /**
   * Get friend requests by status
   */
  async getFriendRequestsByStatus(status: FriendRequestRecord['status']): Promise<FriendRequestRecord[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('friendRequests', 'by-status', status);
  }

  // ==================== Sync Queue Operations ====================

  /**
   * Add an item to the sync queue
   */
  async addToQueue(item: Omit<SyncQueueRecord, 'id' | 'retryCount' | 'status' | 'createdAt'>): Promise<number> {
    const db = await this.ensureDB();
    const queueItem: Omit<SyncQueueRecord, 'id'> = {
      ...item,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
    };
    const id = await db.add('syncQueue', queueItem);
    console.log('[IndexedDB] Added to sync queue:', id);
    return id;
  }

  /**
   * Get the next pending queue item (highest priority first)
   */
  async getNextQueueItem(): Promise<SyncQueueRecord | undefined> {
    const db = await this.ensureDB();
    const pending = await db.getAllFromIndex('syncQueue', 'by-status', 'pending');
    
    if (pending.length === 0) {
      return undefined;
    }

    // Sort by priority (1=high first) then by createdAt (oldest first)
    pending.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.createdAt - b.createdAt;
    });

    return pending[0];
  }

  /**
   * Update a queue item
   */
  async updateQueueItem(id: number, updates: Partial<SyncQueueRecord>): Promise<void> {
    const db = await this.ensureDB();
    const item = await db.get('syncQueue', id);
    if (item) {
      const updated = { ...item, ...updates };
      await db.put('syncQueue', updated);
      console.log('[IndexedDB] Queue item updated:', id);
    }
  }

  /**
   * Remove an item from the queue
   */
  async removeFromQueue(id: number): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('syncQueue', id);
    console.log('[IndexedDB] Removed from queue:', id);
  }

  /**
   * Get queue items by status
   */
  async getQueueItems(status?: SyncQueueRecord['status']): Promise<SyncQueueRecord[]> {
    const db = await this.ensureDB();
    if (status) {
      return db.getAllFromIndex('syncQueue', 'by-status', status);
    }
    return db.getAll('syncQueue');
  }

  /**
   * Get queue length
   */
  async getQueueLength(): Promise<number> {
    const db = await this.ensureDB();
    return db.count('syncQueue');
  }

  /**
   * Clear completed queue items
   */
  async clearCompletedQueue(): Promise<void> {
    const db = await this.ensureDB();
    const completed = await db.getAllFromIndex('syncQueue', 'by-status', 'completed');
    for (const item of completed) {
      if (item.id) {
        await db.delete('syncQueue', item.id);
      }
    }
    console.log('[IndexedDB] Cleared completed queue items:', completed.length);
  }

  // ==================== User Cache Operations ====================

  /**
   * Cache a user profile
   */
  async cacheUser(user: Omit<UserCacheRecord, 'lastFetched' | 'expiresAt'>): Promise<void> {
    const db = await this.ensureDB();
    const now = Date.now();
    const cachedUser: UserCacheRecord = {
      ...user,
      lastFetched: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    };
    await db.put('userCache', cachedUser);
    console.log('[IndexedDB] User cached:', user.userId);
  }

  /**
   * Get a cached user
   */
  async getCachedUser(userId: string): Promise<UserCacheRecord | undefined> {
    const db = await this.ensureDB();
    const user = await db.get('userCache', userId);
    
    // Check if cache is expired
    if (user && user.expiresAt < Date.now()) {
      await db.delete('userCache', userId);
      return undefined;
    }
    
    return user;
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    const db = await this.ensureDB();
    const now = Date.now();
    const allUsers = await db.getAll('userCache');
    
    let cleared = 0;
    for (const user of allUsers) {
      if (user.expiresAt < now) {
        await db.delete('userCache', user.userId);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      console.log('[IndexedDB] Cleared expired cache entries:', cleared);
    }
  }

  // ==================== Metadata Operations ====================

  /**
   * Set metadata
   */
  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    const metadata: SyncMetadataRecord = {
      key,
      value,
      updatedAt: Date.now(),
    };
    await db.put('syncMetadata', metadata);
  }

  /**
   * Get metadata
   */
  async getMetadata(key: string): Promise<any> {
    const db = await this.ensureDB();
    const metadata = await db.get('syncMetadata', key);
    return metadata?.value;
  }

  // ==================== Utility Operations ====================

  /**
   * Clear all data (use with caution!)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear('messages');
    await db.clear('friendRequests');
    await db.clear('userCache');
    await db.clear('syncQueue');
    await db.clear('syncMetadata');
    console.log('[IndexedDB] All data cleared');
  }

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number; percent: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percent = quota > 0 ? (usage / quota) * 100 : 0;
      
      return { usage, quota, percent };
    }
    
    return { usage: 0, quota: 0, percent: 0 };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('[IndexedDB] Database connection closed');
    }
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
export default indexedDBService;
