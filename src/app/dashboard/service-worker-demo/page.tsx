'use client';

/**
 * Service Worker Demo Page
 * Demonstrates service worker, background sync, and push notification features
 */

import { useState, useEffect } from 'react';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { ServiceWorkerManager } from '@/components/offline/ServiceWorkerManager';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useServiceWorker, useBackgroundSync } from '@/hooks/useServiceWorker';
import * as notificationService from '@/services/notificationService';

export default function ServiceWorkerDemoPage() {
  const { isOnline } = useOfflineSync();
  const swState = useServiceWorker();
  const [activeTab, setActiveTab] = useState<'status' | 'notifications' | 'cache' | 'sync'>(
    'status'
  );
  const [notificationCount, setNotificationCount] = useState(0);
  const [syncLog, setSyncLog] = useState<string[]>([]);

  // Listen for background sync
  useBackgroundSync((event) => {
    setSyncLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${event.type}`]);
  });

  const addLog = (message: string) => {
    setSyncLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Test functions
  const testFriendRequestNotification = async () => {
    addLog('Showing friend request notification...');
    await notificationService.showFriendRequestNotification('Alice', 'alice-123');
  };

  const testMessageNotification = async () => {
    addLog('Showing message notification...');
    await notificationService.showMessageNotification(
      'Bob',
      'Hey, how are you doing? Want to hang out later?',
      'bob-123'
    );
  };

  const testLocationNotification = async () => {
    addLog('Showing location notification...');
    await notificationService.showLocationNotification('Charlie', 'charlie-123');
  };

  const testSyncNotification = async () => {
    addLog('Showing sync notification...');
    await notificationService.showSyncNotification('start', 'Syncing 3 messages...');
    setTimeout(async () => {
      await notificationService.showSyncNotification('success', 'All messages synced');
    }, 2000);
  };

  const clearNotifications = async () => {
    addLog('Clearing all notifications...');
    await notificationService.closeAllNotifications();
  };

  const testCache = async () => {
    addLog('Testing cache...');
    try {
      await swState.clearCache();
      addLog('Cache cleared successfully');
    } catch (error) {
      addLog('Cache clear failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const registerBackgroundSync = async () => {
    addLog('Registering background sync...');
    try {
      await swState.registerBackgroundSync();
      addLog('Background sync registered');
    } catch (error) {
      addLog('Background sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const checkForUpdates = async () => {
    addLog('Checking for service worker updates...');
    try {
      await swState.update();
      addLog('Update check completed');
    } catch (error) {
      addLog('Update check failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
      <OfflineIndicator />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Service Worker Demo</h1>
          <p className="text-slate-400">
            Test and manage service worker, background sync, and push notifications
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 rounded-lg p-1 w-fit">
          {(['status', 'notifications', 'cache', 'sync'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="space-y-4">
                {/* Connection Status */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Connection Status</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Online:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                          {isOnline ? 'Connected' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Worker Status */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Service Worker Status</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Supported:</span>
                      <span className={swState.isSupported ? 'text-green-400' : 'text-red-400'}>
                        {swState.isSupported ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Registered:</span>
                      <span className={swState.isRegistered ? 'text-green-400' : 'text-red-400'}>
                        {swState.isRegistered ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Updating:</span>
                      <span className={swState.isUpdating ? 'text-yellow-400' : 'text-slate-400'}>
                        {swState.isUpdating ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {swState.error && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Error:</span>
                        <span className="text-red-400 text-sm">{swState.error}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification Support */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Notification Support</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Supported:</span>
                      <span className={notificationService.areNotificationsSupported() ? 'text-green-400' : 'text-red-400'}>
                        {notificationService.areNotificationsSupported() ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Permission:</span>
                      <span className="text-slate-300">
                        {notificationService.getNotificationPermission()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Test Notifications</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={testFriendRequestNotification}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                    >
                      Friend Request
                    </button>

                    <button
                      onClick={testMessageNotification}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                    >
                      Message
                    </button>

                    <button
                      onClick={testLocationNotification}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                    >
                      Location
                    </button>

                    <button
                      onClick={testSyncNotification}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                    >
                      Sync Status
                    </button>

                    <button
                      onClick={clearNotifications}
                      className="col-span-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                    >
                      Clear All Notifications
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Quick Info</h2>
                  <ul className="text-sm text-slate-400 space-y-2">
                    <li>• Click "Allow" when prompted to receive notifications</li>
                    <li>• Notifications will show in your system tray</li>
                    <li>• Click a notification to navigate to relevant page</li>
                    <li>• Notifications use service worker for offline delivery</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Cache Tab */}
            {activeTab === 'cache' && (
              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Cache Management</h2>
                  <div className="space-y-4">
                    <button
                      onClick={testCache}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                    >
                      Clear Cache
                    </button>

                    <div className="text-sm text-slate-400 space-y-2">
                      <p>Cache operations:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Assets (JS, CSS, fonts) - Cache first</li>
                        <li>API calls - Network first</li>
                        <li>HTML pages - Network first</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Cache Strategy</h2>
                  <div className="space-y-3 text-sm text-slate-400">
                    <div>
                      <p className="font-semibold text-slate-300 mb-1">Assets (Static Files)</p>
                      <p>Cache first - Serve from cache, fallback to network</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-300 mb-1">API Calls</p>
                      <p>Network first - Try network, fallback to cache</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-300 mb-1">HTML Pages</p>
                      <p>Network first - Navigate requests use network first</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Tab */}
            {activeTab === 'sync' && (
              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Background Sync</h2>
                  <div className="space-y-3">
                    <button
                      onClick={registerBackgroundSync}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                    >
                      Register Background Sync
                    </button>

                    <button
                      onClick={checkForUpdates}
                      className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors"
                    >
                      Check for Updates
                    </button>
                  </div>

                  <div className="mt-4 text-sm text-slate-400 space-y-2">
                    <p className="font-semibold text-slate-300">How it works:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Background Sync waits for network to be available</li>
                      <li>When online, queued operations are automatically synced</li>
                      <li>Works even if the page is closed</li>
                      <li>Some browsers may not support this API</li>
                    </ul>
                  </div>
                </div>

                {swState.isUpdating && (
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <div className="text-yellow-400 mt-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-300">Update Available</p>
                        <p className="text-sm text-yellow-200 mt-1">
                          A new version is ready to activate
                        </p>
                        <button
                          onClick={swState.activateWaiting}
                          className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                        >
                          Activate Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Service Worker Manager */}
            <ServiceWorkerManager showDetails={true} />

            {/* Sync Log */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Activity Log</h3>
              <div className="bg-slate-900/50 rounded p-3 h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                {syncLog.length === 0 ? (
                  <p className="text-slate-500">No activity yet</p>
                ) : (
                  syncLog.map((log, i) => (
                    <p key={i} className="text-slate-400">
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
