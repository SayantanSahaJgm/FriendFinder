'use client';

/**
 * Service Worker Manager Component
 * Displays service worker status and provides management controls
 */

import { useEffect, useState } from 'react';
import { useServiceWorker, useBackgroundSync } from '@/hooks/useServiceWorker';

export interface ServiceWorkerManagerProps {
  showDetails?: boolean;
  onUpdateFound?: () => void;
  onControllerChange?: () => void;
}

export function ServiceWorkerManager({
  showDetails = false,
  onUpdateFound,
  onControllerChange,
}: ServiceWorkerManagerProps) {
  const {
    isSupported,
    isRegistered,
    isUpdating,
    error,
    update,
    activateWaiting,
    clearCache,
    registerBackgroundSync,
    subscribeToPush,
  } = useServiceWorker({
    onUpdateFound,
    onControllerChange,
  });

  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Listen for background sync messages
  useBackgroundSync((event) => {
    if (event.type === 'BACKGROUND_SYNC_START') {
      setSyncStatus('Syncing...');
    } else if (event.type === 'PERIODIC_SYNC') {
      setSyncStatus('Periodic sync...');
    }

    // Clear status after 3 seconds
    setTimeout(() => setSyncStatus(null), 3000);
  });

  if (!showDetails) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Service Worker</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isRegistered && !isUpdating ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="text-xs text-slate-400">
            {!isSupported
              ? 'Not supported'
              : isUpdating
                ? 'Updating...'
                : isRegistered
                  ? 'Active'
                  : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Status Info */}
      <div className="space-y-2 mb-4 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Support:</span>
          <span className={isSupported ? 'text-green-400' : 'text-red-400'}>
            {isSupported ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Registered:</span>
          <span className={isRegistered ? 'text-green-400' : 'text-slate-500'}>
            {isRegistered ? 'Yes' : 'No'}
          </span>
        </div>

        {isUpdating && (
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="text-yellow-400">Update pending</span>
          </div>
        )}

        {syncStatus && (
          <div className="flex justify-between">
            <span className="text-slate-400">Sync:</span>
            <span className="text-blue-400">{syncStatus}</span>
          </div>
        )}

        {error && (
          <div className="flex justify-between">
            <span className="text-slate-400">Error:</span>
            <span className="text-red-400 text-xs">{error}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {isUpdating && (
          <button
            onClick={activateWaiting}
            className="w-full px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Apply Update
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={update}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Check Updates
          </button>

          <button
            onClick={clearCache}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Clear Cache
          </button>

          <button
            onClick={registerBackgroundSync}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Register Sync
          </button>

          <button
            onClick={subscribeToPush}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Subscribe Push
          </button>
        </div>
      </div>
    </div>
  );
}

console.log('[ServiceWorkerManager] Loaded');
