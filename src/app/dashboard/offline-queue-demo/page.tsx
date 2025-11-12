'use client';

import { useState, useEffect } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import OfflineMessageComposer from '@/components/offline/OfflineMessageComposer';
import SyncProgress from '@/components/offline/SyncProgress';
import { indexedDBService } from '@/services/offlineSync/IndexedDBService';
import { offlineSyncService } from '@/services/offlineSync/OfflineSyncService';
import {
  RefreshCw,
  Trash2,
  Database,
  Wifi,
  WifiOff,
  Send,
  Users,
  MapPin,
  User,
} from 'lucide-react';

export default function OfflineMessageQueueDemoPage() {
  const {
    isOnline,
    networkStatus,
    syncStatus,
    queueLength,
    isInitialized,
    syncNow,
    clearQueue,
    getStorageInfo,
    queueMessage,
    queueFriendRequest,
    queueProfileUpdate,
    queueLocationUpdate,
  } = useOfflineSync();

  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0, percent: 0 });
  const [messages, setMessages] = useState<any[]>([]);
  const [testUserId, setTestUserId] = useState('user_test_456');
  const [messageContent, setMessageContent] = useState('');
  const [successMessages, setSuccessMessages] = useState<string[]>([]);

  useEffect(() => {
    if (isInitialized) {
      loadMessages();
      updateStorageInfo();
    }
  }, [isInitialized, queueLength, syncStatus]);

  const loadMessages = async () => {
    const pending = await indexedDBService.getQueueItems('pending');
    const completed = await indexedDBService.getQueueItems('completed');
    const failed = await indexedDBService.getQueueItems('failed');
    setMessages([...pending, ...completed, ...failed]);
  };

  const updateStorageInfo = async () => {
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const addTestMessage = async () => {
    if (!messageContent.trim()) return;

    try {
      await queueMessage({
        receiverId: testUserId,
        content: messageContent.trim(),
        chatId: 'demo_chat',
      });

      setSuccessMessages([...successMessages, `Message "${messageContent.trim()}" queued!`]);
      setMessageContent('');
      loadMessages();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessages((prev) => prev.slice(1));
      }, 3000);
    } catch (error) {
      console.error('Error queueing message:', error);
    }
  };

  const addTestFriendRequest = async () => {
    try {
      await queueFriendRequest(testUserId);
      setSuccessMessages([...successMessages, `Friend request to ${testUserId} queued!`]);
      loadMessages();

      setTimeout(() => {
        setSuccessMessages((prev) => prev.slice(1));
      }, 3000);
    } catch (error) {
      console.error('Error queueing friend request:', error);
    }
  };

  const addTestProfileUpdate = async () => {
    try {
      await queueProfileUpdate({
        bio: `Updated bio at ${new Date().toLocaleTimeString()}`,
        profilePicture: 'https://via.placeholder.com/150',
      });

      setSuccessMessages([...successMessages, 'Profile update queued!']);
      loadMessages();

      setTimeout(() => {
        setSuccessMessages((prev) => prev.slice(1));
      }, 3000);
    } catch (error) {
      console.error('Error queueing profile update:', error);
    }
  };

  const addTestLocationUpdate = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await queueLocationUpdate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });

          setSuccessMessages([
            ...successMessages,
            `Location update queued (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
          ]);
          loadMessages();

          setTimeout(() => {
            setSuccessMessages((prev) => prev.slice(1));
          }, 3000);
        } catch (error) {
          console.error('Error queueing location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Failed to get location: ' + error.message);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <OfflineIndicator queueLength={queueLength} showDetails />

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Phase 5.2: Message Queue Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test offline message queueing, sync with real API calls, and exponential backoff retry logic
          </p>
        </div>

        {/* Success Messages */}
        {successMessages.length > 0 && (
          <div className="mb-6 space-y-2">
            {successMessages.map((msg, idx) => (
              <div
                key={idx}
                className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200"
              >
                {msg}
              </div>
            ))}
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Network Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Network Status
              </h3>
              {isOnline ? (
                <Wifi className="w-6 h-6 text-green-500" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-500" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Connection:</span>
                <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {networkStatus.effectiveType && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {networkStatus.effectiveType.toUpperCase()}
                  </span>
                </div>
              )}
              {networkStatus.downlink && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Speed:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {networkStatus.downlink} Mbps
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sync Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sync Status
              </h3>
              <RefreshCw
                className={`w-6 h-6 ${
                  syncStatus === 'syncing'
                    ? 'animate-spin text-blue-500'
                    : syncStatus === 'success'
                    ? 'text-green-500'
                    : syncStatus === 'error'
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {syncStatus}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Queue:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {queueLength} items
                </span>
              </div>
            </div>
          </div>

          {/* Storage Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Storage
              </h3>
              <Database className="w-6 h-6 text-purple-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Used:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatBytes(storageInfo.usage)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Usage:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {storageInfo.percent.toFixed(2)}%
                </span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(storageInfo.percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <SyncProgress showDetails={true} autoHideDuration={0} />
        </div>

        {/* Message Composer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Message Composer
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipient User ID
              </label>
              <input
                type="text"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <OfflineMessageComposer
              receiverId={testUserId}
              chatId="demo_chat"
              onMessageSent={(id, content) => {
                loadMessages();
                setSuccessMessages([...successMessages, `Message queued: "${content}"`]);
              }}
              onError={(error) => {
                alert(`Error: ${error}`);
              }}
            />
          </div>
        </div>

        {/* Test Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={addTestMessage}
                disabled={!isInitialized}
                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Queue Simple Message</span>
              </button>

              <button
                onClick={addTestFriendRequest}
                disabled={!isInitialized}
                className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Queue Friend Request</span>
              </button>

              <button
                onClick={addTestProfileUpdate}
                disabled={!isInitialized}
                className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Queue Profile Update</span>
              </button>

              <button
                onClick={addTestLocationUpdate}
                disabled={!isInitialized}
                className="w-full flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>Queue Location Update</span>
              </button>
            </div>
          </div>

          {/* Sync Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sync Controls
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => syncNow()}
                disabled={!isInitialized || !isOnline || syncStatus === 'syncing'}
                className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                <span>Sync Now</span>
              </button>

              <button
                onClick={clearQueue}
                disabled={!isInitialized || queueLength === 0}
                className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Queue ({queueLength})</span>
              </button>

              <button
                onClick={() => {
                  loadMessages();
                  updateStorageInfo();
                }}
                disabled={!isInitialized}
                className="w-full flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Queue Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Queued Items ({messages.length})
          </h3>
          {messages.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No queued items. Use the actions above to create test items!
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        #{item.id}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : item.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium">
                        {item.operation}
                      </span>
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {item.operation === 'message' && `Message to ${item.payload.receiverId}`}
                      {item.operation === 'friendRequest' && `Friend request to ${item.payload.toId}`}
                      {item.operation === 'profileUpdate' && 'Profile update'}
                      {item.operation === 'locationUpdate' &&
                        `Location (${item.payload.latitude.toFixed(4)}, ${item.payload.longitude.toFixed(4)})`}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Retry: {item.retryCount} | Priority: {item.priority}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Testing Instructions
          </h3>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>
              1. <strong>Queue Operations</strong>: Use "Quick Actions" to queue messages, friend requests, profile
              updates, and location updates
            </li>
            <li>
              2. <strong>Go Offline</strong>: Open DevTools → Network → Offline or disable network
            </li>
            <li>
              3. <strong>Queue More Items</strong>: Add items while offline - they'll be automatically queued
            </li>
            <li>
              4. <strong>Go Online</strong>: Restore network connection - sync will trigger automatically
            </li>
            <li>
              5. <strong>Manual Sync</strong>: Or click "Sync Now" to manually trigger synchronization
            </li>
            <li>
              6. <strong>View Results</strong>: Check sync progress and status in the "Sync Progress" section
            </li>
            <li>
              7. <strong>API Testing</strong>: Items fail gracefully if endpoints don't exist (expected in demo)
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
