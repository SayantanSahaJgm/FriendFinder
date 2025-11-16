/**
 * Real-time Messaging Service
 * Handles real-time message delivery, typing indicators, and read receipts
 */

import { webSocketService } from './WebSocketService';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface RealtimeMessage {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  isOptimistic?: boolean; // Optimistically shown before server confirmation
}

export interface TypingIndicator {
  userId: string;
  recipientId: string;
  isTyping: boolean;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: number;
}

export interface MessageStatusUpdate {
  messageId: string;
  status: MessageStatus;
  timestamp: number;
}

type MessageCallback = (message: RealtimeMessage) => void;
type TypingCallback = (indicator: TypingIndicator) => void;
type ReadReceiptCallback = (receipt: ReadReceipt) => void;
type StatusUpdateCallback = (update: MessageStatusUpdate) => void;

/**
 * Real-time Messaging Service
 */
class RealtimeMessagingService {
  private messageListeners: Set<MessageCallback> = new Set();
  private typingListeners: Set<TypingCallback> = new Set();
  private readReceiptListeners: Set<ReadReceiptCallback> = new Set();
  private statusUpdateListeners: Set<StatusUpdateCallback> = new Set();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  /**
   * Initialize the service
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Listen for incoming messages
    webSocketService.on('message:received', this.handleMessageReceived);

    // Listen for message status updates
    webSocketService.on('message:status', this.handleMessageStatus);

    // Listen for typing indicators
    webSocketService.on('typing:start', this.handleTypingStart);
    webSocketService.on('typing:stop', this.handleTypingStop);

    // Listen for read receipts
    webSocketService.on('message:read', this.handleReadReceipt);

    this.isInitialized = true;
    console.log('[RealtimeMessaging] Service initialized');
  }

  /**
   * Cleanup the service
   */
  destroy(): void {
    webSocketService.off('message:received', this.handleMessageReceived);
    webSocketService.off('message:status', this.handleMessageStatus);
    webSocketService.off('typing:start', this.handleTypingStart);
    webSocketService.off('typing:stop', this.handleTypingStop);
    webSocketService.off('message:read', this.handleReadReceipt);

    this.messageListeners.clear();
    this.typingListeners.clear();
    this.readReceiptListeners.clear();
    this.statusUpdateListeners.clear();
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();

    this.isInitialized = false;
    console.log('[RealtimeMessaging] Service destroyed');
  }

  // ==================== Message Sending ====================

  /**
   * Send a message (optimistic update)
   */
  sendMessage(
    recipientId: string,
    text: string,
    senderId: string
  ): RealtimeMessage {
    const optimisticMessage: RealtimeMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      senderId,
      recipientId,
      text,
      timestamp: Date.now(),
      status: 'sending',
      isOptimistic: true,
    };

    // Emit to socket
    const success = webSocketService.emit('message:send', {
      recipientId,
      text,
      tempId: optimisticMessage.id,
    });

    if (!success) {
      optimisticMessage.status = 'failed';
    }

    return optimisticMessage;
  }

  /**
   * Handle incoming message
   */
  private handleMessageReceived = (data: any) => {
    const message: RealtimeMessage = {
      id: data.messageId || data.id,
      senderId: data.senderId,
      recipientId: data.recipientId,
      text: data.text || data.content,
      timestamp: data.timestamp || Date.now(),
      status: 'delivered',
      isOptimistic: false,
    };

    console.log('[RealtimeMessaging] Message received:', message.id);

    // Notify listeners
    this.messageListeners.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('[RealtimeMessaging] Error in message listener:', error);
      }
    });

    // Auto-send delivery receipt
    this.sendDeliveryReceipt(message.id);
  };

  /**
   * Handle message status update
   */
  private handleMessageStatus = (data: any) => {
    const update: MessageStatusUpdate = {
      messageId: data.messageId || data.id,
      status: data.status,
      timestamp: data.timestamp || Date.now(),
    };

    console.log('[RealtimeMessaging] Message status update:', update);

    this.statusUpdateListeners.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('[RealtimeMessaging] Error in status update listener:', error);
      }
    });
  };

  /**
   * Send delivery receipt
   */
  private sendDeliveryReceipt(messageId: string): void {
    webSocketService.emit('message:delivered', { messageId });
  }

  // ==================== Typing Indicators ====================

  /**
   * Send typing indicator (with auto-stop after 3s)
   */
  startTyping(recipientId: string, userId: string): void {
    // Clear existing timeout
    const key = `${userId}-${recipientId}`;
    const existingTimeout = this.typingTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Emit typing start
    webSocketService.emit('typing:start', { recipientId });

    // Auto-stop after 3 seconds
    const timeout = setTimeout(() => {
      this.stopTyping(recipientId, userId);
    }, 3000);

    this.typingTimeouts.set(key, timeout);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(recipientId: string, userId: string): void {
    const key = `${userId}-${recipientId}`;
    const existingTimeout = this.typingTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(key);
    }

    webSocketService.emit('typing:stop', { recipientId });
  }

  /**
   * Handle typing start from another user
   */
  private handleTypingStart = (data: any) => {
    const indicator: TypingIndicator = {
      userId: data.userId,
      recipientId: data.recipientId,
      isTyping: true,
    };

    console.log('[RealtimeMessaging] User started typing:', indicator.userId);

    this.typingListeners.forEach(callback => {
      try {
        callback(indicator);
      } catch (error) {
        console.error('[RealtimeMessaging] Error in typing listener:', error);
      }
    });
  };

  /**
   * Handle typing stop from another user
   */
  private handleTypingStop = (data: any) => {
    const indicator: TypingIndicator = {
      userId: data.userId,
      recipientId: data.recipientId,
      isTyping: false,
    };

    console.log('[RealtimeMessaging] User stopped typing:', indicator.userId);

    this.typingListeners.forEach(callback => {
      try {
        callback(indicator);
      } catch (error) {
        console.error('[RealtimeMessaging] Error in typing listener:', error);
      }
    });
  };

  // ==================== Read Receipts ====================

  /**
   * Mark message as read
   */
  markAsRead(messageId: string, userId: string): void {
    webSocketService.emit('message:read', {
      messageId,
      readAt: Date.now(),
    });

    // Also notify local listeners
    const receipt: ReadReceipt = {
      messageId,
      userId,
      readAt: Date.now(),
    };

    this.readReceiptListeners.forEach(callback => {
      try {
        callback(receipt);
      } catch (error) {
        console.error('[RealtimeMessaging] Error in read receipt listener:', error);
      }
    });
  }

  /**
   * Handle read receipt from another user
   */
  private handleReadReceipt = (data: any) => {
    const messageId = typeof data === 'string' ? data : data.messageId;
    const readAt = (typeof data === 'string' ? undefined : data.readAt) || Date.now();

    const receipt: ReadReceipt = {
      messageId: messageId,
      userId: data && data.userId ? data.userId : '',
      readAt: readAt,
    };

    console.log('[RealtimeMessaging] Message read:', receipt.messageId);

    this.readReceiptListeners.forEach(callback => {
      try {
        callback(receipt);
      } catch (error) {
        console.error('[RealtimeMessaging] Error in read receipt listener:', error);
      }
    });
  };

  // ==================== Event Listeners ====================

  /**
   * Subscribe to incoming messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  /**
   * Subscribe to typing indicators
   */
  onTyping(callback: TypingCallback): () => void {
    this.typingListeners.add(callback);
    return () => {
      this.typingListeners.delete(callback);
    };
  }

  /**
   * Subscribe to read receipts
   */
  onReadReceipt(callback: ReadReceiptCallback): () => void {
    this.readReceiptListeners.add(callback);
    return () => {
      this.readReceiptListeners.delete(callback);
    };
  }

  /**
   * Subscribe to message status updates
   */
  onStatusUpdate(callback: StatusUpdateCallback): () => void {
    this.statusUpdateListeners.add(callback);
    return () => {
      this.statusUpdateListeners.delete(callback);
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      messageListeners: this.messageListeners.size,
      typingListeners: this.typingListeners.size,
      readReceiptListeners: this.readReceiptListeners.size,
      statusUpdateListeners: this.statusUpdateListeners.size,
      activeTypingTimeouts: this.typingTimeouts.size,
      isInitialized: this.isInitialized,
    };
  }
}

// Create singleton instance
export const realtimeMessagingService = new RealtimeMessagingService();

// Auto-initialize when WebSocket connects
if (typeof window !== 'undefined') {
  webSocketService.onStatusChange((status) => {
    if (status === 'connected') {
      realtimeMessagingService.initialize();
    }
  });
}

export default realtimeMessagingService;
