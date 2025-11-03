'use client';

import React, { useState, useCallback } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useSession } from 'next-auth/react';
import { AlertCircle, Send, Clock } from 'lucide-react';

interface OfflineMessageComposerProps {
  receiverId: string;
  chatId?: string;
  onMessageSent?: (messageId: string, content: string) => void;
  onError?: (error: string) => void;
}

/**
 * Message composer with offline support
 * Automatically queues messages when offline
 */
export default function OfflineMessageComposer({
  receiverId,
  chatId,
  onMessageSent,
  onError,
}: OfflineMessageComposerProps) {
  const { data: session } = useSession();
  const { isOnline, queueMessage } = useOfflineSync();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!content.trim()) {
        return;
      }

      if (!session?.user) {
        onError?.('Not authenticated');
        return;
      }

      setIsLoading(true);

      try {
        if (isOnline) {
          // Send immediately via API
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receiverId,
              content: content.trim(),
              chatId,
              timestamp: Date.now(),
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to send message');
          }

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || 'Failed to send message');
          }

          setContent('');
          onMessageSent?.(data.data.messageId, content.trim());
        } else {
          // Queue for offline sync
          await queueMessage({
            receiverId,
            content: content.trim(),
            chatId,
            timestamp: Date.now(),
          });

          setContent('');
          setShowOfflineIndicator(true);
          onMessageSent?.('pending', content.trim());

          // Hide offline indicator after 3 seconds
          setTimeout(() => setShowOfflineIndicator(false), 3000);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
        onError?.(errorMsg);
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [content, isOnline, receiverId, chatId, session, queueMessage, onMessageSent, onError]
  );

  return (
    <div className="space-y-2">
      {showOfflineIndicator && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Message queued. It will be sent when you reconnect.</span>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isOnline ? 'Type a message...' : 'Type a message (offline)...'}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isLoading || !content.trim()
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : isOnline
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{isLoading ? 'Sending...' : isOnline ? 'Send' : 'Queue'}</span>
        </button>
      </form>
    </div>
  );
}
