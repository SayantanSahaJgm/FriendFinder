/**
 * Offline Page
 * Shown when the app is offline or a page fails to load
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import SyncProgress from '@/components/offline/SyncProgress';

export default function OfflinePage() {
  const { isOnline, queueLength, syncNow } = useOfflineSync();
  const [showSyncProgress, setShowSyncProgress] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Auto-redirect when online
    if (isOnline) {
      const timer = setTimeout(() => {
        // Use client-side navigation instead of full reload
        try {
          router.push('/dashboard');
        } catch (e) {
          window.location.href = '/dashboard';
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <OfflineIndicator />

      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.111 16H5m13 0h3M4 4h16v8m-4-8V3m0 8v5m-4-5v5m-4-5v5M3 13h18"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">You're Offline</h1>
            <p className="text-slate-400">
              {isOnline
                ? 'Reconnected! Redirecting...'
                : 'Unable to connect to the internet'}
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connection Status</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Queued Items */}
              {queueLength > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pending Sync</span>
                  <span className="text-blue-400 font-medium">{queueLength} items</span>
                </div>
              )}

              {/* Helpful Tips */}
              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-3">Tips while offline:</p>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Messages will sync automatically when online</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Your data is safely stored locally</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Check your connection and try again</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Sync Button */}
            {queueLength > 0 && (
              <button
                onClick={() => {
                  setShowSyncProgress(true);
                  syncNow();
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Sync Now ({queueLength})
              </button>
            )}

            {/* Retry Button */}
            <button
              onClick={() => {
                try {
                  router.refresh();
                } catch (e) {
                  // no-op fallback: suggest manual refresh
                  alert('Please refresh the page to retry');
                }
              }}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>

            {/* Dashboard Button */}
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="w-full px-4 py-2 border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-300 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Sync Progress */}
          {showSyncProgress && (
            <div className="mt-6">
              <SyncProgress
                showDetails={true}
                autoHideDuration={3000}
              />
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              FriendFinder • Offline Mode Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
