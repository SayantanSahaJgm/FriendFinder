'use client';

import { useState, useEffect } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { indexedDBService } from '@/services/offlineSync/IndexedDBService';
import { RefreshCw, Trash2, Database, Wifi, WifiOff } from 'lucide-react';

export default function OfflineDemoPage() {
  const {
    isOnline,
    networkStatus,
    syncStatus,
    queueLength,
    isInitialized,
    syncNow,
    clearQueue,
    getStorageInfo,
  } = useOfflineSync();

  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0, percent: 0 });
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (isInitialized) {
      loadMessages();
      updateStorageInfo();
    }
  }, [isInitialized, queueLength]);

  const loadMessages = async () => {
    const pending = await indexedDBService.getMessagesByStatus('pending');
    setMessages(pending);
  };

  const updateStorageInfo = async () => {
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  const addTestMessage = async () => {
    const message = {
      id: `msg_${Date.now()}`,
      chatId: 'demo_chat',
      senderId: 'user_demo',
      receiverId: 'user_test',
      content: `Test message sent at ${new Date().toLocaleTimeString()}`,
      timestamp: Date.now(),
    };

    await indexedDBService.addMessage(message);
    await indexedDBService.addToQueue({
      operation: 'message',
      payload: message,
      priority: 1,
    });

    loadMessages();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <OfflineIndicator queueLength={queueLength} showDetails />

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Offline Sync Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test offline message queueing and synchronization
          </p>
        </div>

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
              {networkStatus.rtt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Latency:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {networkStatus.rtt} ms
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Initialized:</span>
                <span className={`font-medium ${isInitialized ? 'text-green-600' : 'text-red-600'}`}>
                  {isInitialized ? 'Yes' : 'No'}
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
                <span className="text-gray-600 dark:text-gray-400">Quota:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatBytes(storageInfo.quota)}
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

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={addTestMessage}
              disabled={!isInitialized}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Add Test Message</span>
            </button>

            <button
              onClick={() => syncNow()}
              disabled={!isInitialized || !isOnline || syncStatus === 'syncing'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              <span>Sync Now</span>
            </button>

            <button
              onClick={clearQueue}
              disabled={!isInitialized || queueLength === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Queue</span>
            </button>

            <button
              onClick={() => {
                loadMessages();
                updateStorageInfo();
              }}
              disabled={!isInitialized}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Pending Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pending Messages ({messages.length})
          </h3>
          {messages.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No pending messages. Click "Add Test Message" to create one!
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {msg.id}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          msg.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : msg.status === 'synced'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{msg.content}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Retry count: {msg.retryCount}
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
            <li>1. Click "Add Test Message" to create a test message (queued for sync)</li>
            <li>2. Open DevTools → Application → Storage → IndexedDB → friendfinder_offline_v1</li>
            <li>3. Go offline (DevTools → Network → Offline) or disable network</li>
            <li>4. Add more test messages - they will queue automatically</li>
            <li>5. Go back online and watch messages sync automatically</li>
            <li>6. Or click "Sync Now" to manually trigger synchronization</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
