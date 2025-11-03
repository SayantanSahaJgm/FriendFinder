'use client';

import { useEffect, useState } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { offlineSyncService, type SyncResult } from '@/services/offlineSync/OfflineSyncService';
import { CheckCircle, AlertCircle, Loader, Trash2 } from 'lucide-react';

interface SyncProgressProps {
  showDetails?: boolean;
  autoHideDuration?: number; // ms, 0 = never hide
}

export default function SyncProgress({ showDetails = true, autoHideDuration = 5000 }: SyncProgressProps) {
  const { isOnline, syncStatus, queueLength, clearQueue } = useOfflineSync();
  const [results, setResults] = useState<SyncResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (syncStatus === 'syncing') {
      setShowResults(true);
      setResults([]);
    } else if (syncStatus === 'success' || syncStatus === 'error') {
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          setShowResults(false);
          setResults([]);
        }, autoHideDuration);

        return () => clearTimeout(timer);
      }
    }
  }, [syncStatus, autoHideDuration]);

  // Subscribe to sync results
  useEffect(() => {
    const unsubscribe = offlineSyncService.onSyncStatus(({ syncing, processed }) => {
      if (!syncing && processed > 0) {
        // Fetch results after sync completes
        setShowResults(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!showResults && queueLength === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (syncStatus === 'syncing') return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    if (syncStatus === 'success') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (syncStatus === 'error') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  };

  const getStatusIcon = () => {
    if (syncStatus === 'syncing')
      return <Loader className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />;
    if (syncStatus === 'success')
      return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    if (syncStatus === 'error') return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    return null;
  };

  const getStatusText = () => {
    if (syncStatus === 'syncing') return `Syncing ${queueLength} item${queueLength > 1 ? 's' : ''}...`;
    if (syncStatus === 'success') return 'Sync completed successfully!';
    if (syncStatus === 'error') return 'Some items failed to sync. Retrying...';
    if (queueLength > 0) return `${queueLength} item${queueLength > 1 ? 's' : ''} queued`;
    return 'Ready to sync';
  };

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${getStatusColor()}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{getStatusText()}</h3>
            {showDetails && queueLength > 0 && syncStatus !== 'syncing' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {successCount > 0 && <span>{successCount} synced </span>}
                {failureCount > 0 && <span>{failureCount} failed (retrying)</span>}
              </p>
            )}
          </div>
        </div>

        {queueLength > 0 && syncStatus !== 'syncing' && (
          <button
            onClick={clearQueue}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Clear queue"
          >
            <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {syncStatus === 'syncing' && (
        <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div className="bg-blue-600 dark:bg-blue-400 h-full animate-pulse" style={{ width: '66%' }} />
        </div>
      )}

      {/* Results Details */}
      {showDetails && results.length > 0 && (
        <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
          {results.map((result, idx) => (
            <div key={idx} className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-gray-900 dark:text-white">
                  <span className="capitalize">{result.operation}</span>
                  {result.retriesUsed ? ` (${result.retriesUsed} attempt${result.retriesUsed > 1 ? 's' : ''})` : ''}
                </p>
                {result.error && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">{result.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Footer */}
      {showDetails && !isOnline && (
        <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-current border-opacity-20">
          You are offline. Items will sync automatically when you reconnect.
        </div>
      )}
    </div>
  );
}
