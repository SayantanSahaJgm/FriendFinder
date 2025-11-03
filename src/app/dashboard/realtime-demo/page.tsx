/**
 * Real-time Features Demo Page
 * Comprehensive demo of all Phase 6 real-time features
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, MessageSquare, Users, MapPin, Bell, Activity } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useRealtimeMessaging } from '@/hooks/useRealtimeMessaging';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';
import { useNotifications, useUnreadCount } from '@/hooks/useNotifications';
import ConnectionStatus from '@/components/realtime/ConnectionStatus';
import TypingIndicator from '@/components/realtime/TypingIndicator';
import MessageStatusBadge from '@/components/realtime/MessageStatusBadge';
import PresenceBadge from '@/components/realtime/PresenceBadge';
import PresenceText from '@/components/realtime/PresenceText';
import UserAvatarWithPresence from '@/components/realtime/UserAvatarWithPresence';
import NotificationBadge from '@/components/realtime/NotificationBadge';
import NotificationCenter from '@/components/realtime/NotificationCenter';
import NotificationToast from '@/components/realtime/NotificationToast';

export default function RealtimeDemoPage() {
  const [activeTab, setActiveTab] = useState<'websocket' | 'messaging' | 'presence' | 'notifications'>('websocket');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<any[]>([]);

  // WebSocket
  const { status, isConnected, stats, connect, disconnect } = useWebSocket();

  // Messaging
  const { sendMessage, startTyping, stopTyping, isUserTyping } = useRealtimeMessaging();
  const [messageText, setMessageText] = useState('');
  const [recipientId, setRecipientId] = useState('demo-user-123');
  const [sentMessages, setSentMessages] = useState<any[]>([]);

  // Presence
  const { presence: demoUserPresence, isLoading: presenceLoading } = useRealtimePresence('demo-user-123');

  // Notifications
  const { notifications, unreadNotifications } = useNotifications();
  const unreadCount = useUnreadCount();

  // Listen for new notifications
  useEffect(() => {
    const handleNotification = (notif: any) => {
      setToastNotifications(prev => [...prev, notif]);
    };

    // Subscribe to notifications
    // Note: In real app, this would be done via useNotificationListener
  }, []);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const msg = sendMessage(recipientId, messageText, 'current-user-123');
    setSentMessages(prev => [...prev, msg]);
    setMessageText('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (e.target.value) {
      startTyping(recipientId, 'current-user-123');
    } else {
      stopTyping(recipientId, 'current-user-123');
    }
  };

  const removeToast = (id: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Real-time Features Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Phase 6: WebSocket, Messaging, Presence & Notifications
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionStatus showLabel />
              <NotificationBadge count={unreadCount}>
                <button
                  onClick={() => setShowNotificationCenter(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
              </NotificationBadge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'websocket', label: 'WebSocket', icon: Wifi },
            { id: 'messaging', label: 'Messaging', icon: MessageSquare },
            { id: 'presence', label: 'Presence', icon: Users },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'websocket' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  WebSocket Connection
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="font-medium">Status:</span>
                    <ConnectionStatus showLabel />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Reconnect Attempts</div>
                      <div className="text-2xl font-bold">{stats.reconnectAttempt}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Last Pong</div>
                      <div className="text-2xl font-bold">{stats.timeSinceLastPong}s</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={connect}
                      disabled={isConnected}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Connect
                    </button>
                    <button
                      onClick={disconnect}
                      disabled={!isConnected}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'messaging' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Real-time Messaging
                </h2>

                <div className="space-y-4">
                  {/* Message Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Send Message</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={handleTyping}
                        onBlur={() => stopTyping(recipientId, 'current-user-123')}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  {isUserTyping('demo-user-123') && (
                    <TypingIndicator isTyping userName="Demo User" />
                  )}

                  {/* Sent Messages */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Sent Messages</h3>
                    {sentMessages.map((msg, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="flex-1">{msg.text}</span>
                        <MessageStatusBadge status={msg.status} showLabel />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'presence' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Presence
                </h2>

                <div className="space-y-4">
                  {/* Demo User */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <UserAvatarWithPresence
                      alt="Demo User"
                      status={demoUserPresence?.status}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">Demo User</h3>
                      <PresenceText presence={demoUserPresence} />
                    </div>
                    <PresenceBadge status={demoUserPresence?.status || 'offline'} size="lg" />
                  </div>

                  {/* Status Examples */}
                  <div className="grid grid-cols-3 gap-4">
                    {(['online', 'away', 'offline'] as const).map(status => (
                      <div key={status} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                        <PresenceBadge status={status} size="lg" className="mb-2 justify-center" />
                        <div className="text-sm font-medium capitalize">{status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="font-medium">Unread Count:</span>
                    <NotificationBadge count={unreadCount} size="lg" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Recent Notifications</h3>
                    {unreadNotifications.slice(0, 5).map(notif => (
                      <div key={notif.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="font-medium text-sm">{notif.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Connection</span>
                  <span className="font-medium">{status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Notifications</span>
                  <span className="font-medium">{notifications.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Unread</span>
                  <span className="font-medium">{unreadCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toastNotifications.map(notif => (
          <NotificationToast
            key={notif.id}
            notification={notif}
            onDismiss={() => removeToast(notif.id)}
          />
        ))}
      </div>
    </div>
  );
}
