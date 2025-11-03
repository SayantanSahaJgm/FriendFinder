/**
 * useRealtimeMessaging Hook
 * React hook for real-time messaging features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  realtimeMessagingService,
  type RealtimeMessage,
  type TypingIndicator,
  type ReadReceipt,
  type MessageStatusUpdate,
  type MessageStatus,
} from '@/services/realtime/RealtimeMessagingService';
import { useWebSocket } from './useWebSocket';

export interface UseRealtimeMessagingReturn {
  // Message operations
  sendMessage: (recipientId: string, text: string, senderId: string) => RealtimeMessage;
  markAsRead: (messageId: string, userId: string) => void;
  
  // Typing indicators
  startTyping: (recipientId: string, userId: string) => void;
  stopTyping: (recipientId: string, userId: string) => void;
  isUserTyping: (userId: string) => boolean;
  
  // State
  isConnected: boolean;
  stats: ReturnType<typeof realtimeMessagingService.getStats>;
}

/**
 * Hook to use real-time messaging in React components
 */
export function useRealtimeMessaging(currentUserId?: string): UseRealtimeMessagingReturn {
  const { isConnected } = useWebSocket();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState(realtimeMessagingService.getStats());
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(realtimeMessagingService.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to typing indicators
  useEffect(() => {
    const unsubscribe = realtimeMessagingService.onTyping((indicator: TypingIndicator) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        
        if (indicator.isTyping) {
          newSet.add(indicator.userId);
          
          // Auto-remove after 5 seconds
          const existingTimeout = typingTimeoutsRef.current.get(indicator.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          const timeout = setTimeout(() => {
            setTypingUsers(current => {
              const updated = new Set(current);
              updated.delete(indicator.userId);
              return updated;
            });
            typingTimeoutsRef.current.delete(indicator.userId);
          }, 5000);
          
          typingTimeoutsRef.current.set(indicator.userId, timeout);
        } else {
          newSet.delete(indicator.userId);
          const existingTimeout = typingTimeoutsRef.current.get(indicator.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingTimeoutsRef.current.delete(indicator.userId);
          }
        }
        
        return newSet;
      });
    });

    return () => {
      unsubscribe();
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, []);

  // Send message
  const sendMessage = useCallback((recipientId: string, text: string, senderId: string) => {
    return realtimeMessagingService.sendMessage(recipientId, text, senderId);
  }, []);

  // Mark as read
  const markAsRead = useCallback((messageId: string, userId: string) => {
    realtimeMessagingService.markAsRead(messageId, userId);
  }, []);

  // Start typing
  const startTyping = useCallback((recipientId: string, userId: string) => {
    realtimeMessagingService.startTyping(recipientId, userId);
  }, []);

  // Stop typing
  const stopTyping = useCallback((recipientId: string, userId: string) => {
    realtimeMessagingService.stopTyping(recipientId, userId);
  }, []);

  // Check if user is typing
  const isUserTyping = useCallback((userId: string) => {
    return typingUsers.has(userId);
  }, [typingUsers]);

  return {
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    isUserTyping,
    isConnected,
    stats,
  };
}

/**
 * Hook to listen for incoming messages
 */
export function useRealtimeMessages(
  callback: (message: RealtimeMessage) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = realtimeMessagingService.onMessage(callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook to listen for message status updates
 */
export function useMessageStatusUpdates(
  callback: (update: MessageStatusUpdate) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = realtimeMessagingService.onStatusUpdate(callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook to listen for read receipts
 */
export function useReadReceipts(
  callback: (receipt: ReadReceipt) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = realtimeMessagingService.onReadReceipt(callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useRealtimeMessaging;
