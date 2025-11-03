import { indexedDBService } from '@/services/offlineSync/IndexedDBService';

describe('IndexedDBService', () => {
  beforeAll(async () => {
    await indexedDBService.init();
  });

  afterEach(async () => {
    await indexedDBService.clearAll();
  });

  afterAll(() => {
    indexedDBService.close();
  });

  describe('Message Operations', () => {
    it('should add and retrieve a message', async () => {
      const message = {
        id: 'msg_1',
        chatId: 'chat_1',
        senderId: 'user_1',
        receiverId: 'user_2',
        content: 'Hello, world!',
        timestamp: Date.now(),
      };

      await indexedDBService.addMessage(message);
      const retrieved = await indexedDBService.getMessage('msg_1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.content).toBe('Hello, world!');
      expect(retrieved?.status).toBe('pending');
      expect(retrieved?.retryCount).toBe(0);
    });

    it('should update message status', async () => {
      const message = {
        id: 'msg_2',
        chatId: 'chat_1',
        senderId: 'user_1',
        receiverId: 'user_2',
        content: 'Test message',
        timestamp: Date.now(),
      };

      await indexedDBService.addMessage(message);
      await indexedDBService.updateMessage('msg_2', { status: 'synced' });

      const updated = await indexedDBService.getMessage('msg_2');
      expect(updated?.status).toBe('synced');
    });

    it('should get messages by status', async () => {
      const messages = [
        {
          id: 'msg_3',
          chatId: 'chat_1',
          senderId: 'user_1',
          receiverId: 'user_2',
          content: 'Message 1',
          timestamp: Date.now(),
        },
        {
          id: 'msg_4',
          chatId: 'chat_1',
          senderId: 'user_1',
          receiverId: 'user_2',
          content: 'Message 2',
          timestamp: Date.now(),
        },
      ];

      await indexedDBService.addMessage(messages[0]);
      await indexedDBService.addMessage(messages[1]);
      await indexedDBService.updateMessage('msg_4', { status: 'synced' });

      const pending = await indexedDBService.getMessagesByStatus('pending');
      const synced = await indexedDBService.getMessagesByStatus('synced');

      expect(pending).toHaveLength(1);
      expect(synced).toHaveLength(1);
    });
  });

  describe('Sync Queue Operations', () => {
    it('should add items to queue', async () => {
      const item = {
        operation: 'message' as const,
        payload: { content: 'Test' },
        priority: 1 as const,
      };

      const id = await indexedDBService.addToQueue(item);
      expect(id).toBeGreaterThan(0);

      const queueLength = await indexedDBService.getQueueLength();
      expect(queueLength).toBe(1);
    });

    it('should get next queue item by priority', async () => {
      await indexedDBService.addToQueue({
        operation: 'message',
        payload: { content: 'Low priority' },
        priority: 3,
      });

      await indexedDBService.addToQueue({
        operation: 'message',
        payload: { content: 'High priority' },
        priority: 1,
      });

      await indexedDBService.addToQueue({
        operation: 'message',
        payload: { content: 'Normal priority' },
        priority: 2,
      });

      const next = await indexedDBService.getNextQueueItem();
      expect(next?.payload.content).toBe('High priority');
      expect(next?.priority).toBe(1);
    });

    it('should clear completed queue items', async () => {
      const id1 = await indexedDBService.addToQueue({
        operation: 'message',
        payload: { content: 'Item 1' },
        priority: 1,
      });

      const id2 = await indexedDBService.addToQueue({
        operation: 'message',
        payload: { content: 'Item 2' },
        priority: 1,
      });

      await indexedDBService.updateQueueItem(id1, { status: 'completed' });
      await indexedDBService.updateQueueItem(id2, { status: 'pending' });

      await indexedDBService.clearCompletedQueue();

      const remaining = await indexedDBService.getQueueLength();
      expect(remaining).toBe(1);
    });
  });

  describe('User Cache Operations', () => {
    it('should cache and retrieve user', async () => {
      const user = {
        userId: 'user_1',
        username: 'testuser',
        profileData: { bio: 'Test bio' },
      };

      await indexedDBService.cacheUser(user);
      const cached = await indexedDBService.getCachedUser('user_1');

      expect(cached).toBeDefined();
      expect(cached?.username).toBe('testuser');
      expect(cached?.profileData.bio).toBe('Test bio');
    });

    it('should not return expired cache', async () => {
      const user = {
        userId: 'user_2',
        username: 'testuser2',
        profileData: {},
      };

      await indexedDBService.cacheUser(user);
      
      // Manually set expiration to past
      const db = await (indexedDBService as any).ensureDB();
      const cached = await db.get('userCache', 'user_2');
      if (cached) {
        cached.expiresAt = Date.now() - 1000;
        await db.put('userCache', cached);
      }

      const retrieved = await indexedDBService.getCachedUser('user_2');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Storage Management', () => {
    it('should get storage estimate', async () => {
      const estimate = await indexedDBService.getStorageEstimate();
      
      expect(estimate).toHaveProperty('usage');
      expect(estimate).toHaveProperty('quota');
      expect(estimate).toHaveProperty('percent');
      expect(typeof estimate.usage).toBe('number');
      expect(typeof estimate.quota).toBe('number');
      expect(typeof estimate.percent).toBe('number');
    });

    it('should clear all data', async () => {
      await indexedDBService.addMessage({
        id: 'msg_clear',
        chatId: 'chat_1',
        senderId: 'user_1',
        receiverId: 'user_2',
        content: 'Test',
        timestamp: Date.now(),
      });

      await indexedDBService.addToQueue({
        operation: 'message',
        payload: { content: 'Test' },
        priority: 1,
      });

      await indexedDBService.clearAll();

      const messageCount = (await indexedDBService.getMessagesByStatus('pending')).length;
      const queueLength = await indexedDBService.getQueueLength();

      expect(messageCount).toBe(0);
      expect(queueLength).toBe(0);
    });
  });
});
