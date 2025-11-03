'use client';

/**
 * Sync Dashboard Component  
 * Real-time visualization of offline sync status and queue
 */

import { useState, useEffect } from 'react';
import { offlineSyncService } from '@/services/offlineSync/OfflineSyncService';
import { indexedDBService, type SyncQueueRecord } from '@/services/offlineSync/IndexedDBService';
import { networkStatusService } from '@/services/offlineSync/NetworkStatusService';
import {
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
  AlertTriangle,
  TrendingUp,
  Database,
  Activity,
} from 'lucide-react';

type ConnectionQuality = 'good' | 'fair' | 'poor';
type EffectiveType = '4g' | '3g' | '2g' | 'slow-2g';

interface SyncStats {
  total: number;
  pending: number;
  inProgress: number;
  succeeded: number;
  failed: number;
  retrying: number;
}

interface QueueVisualization {
  id: string;
  operation: string;
  endpoint: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'in-progress' | 'failed';
  retryCount: number;
  maxRetries: number;
  addedAt: number;
  lastAttempt?: number;
}

export default function SyncDashboard() {
  const [isOnline, setIsOnline] = useState(networkStatusService.isOnline());
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('good');
  const [effectiveType, setEffectiveType] = useState<EffectiveType | null>('4g');
  const [syncStats, setSyncStats] = useState<SyncStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    succeeded: 0,
    failed: 0,
    retrying: 0,
  });
  const [queueItems, setQueueItems] = useState<QueueVisualization[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncHistory, setSyncHistory] = useState<Array<{
    timestamp: number;
    success: boolean;
    itemId: string;
    duration: number;
  }>>([]);

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribe = networkStatusService.subscribe((status) => {
      setIsOnline(status.isOnline);
      setEffectiveType((status.effectiveType as EffectiveType) || null);
      
      // Calculate quality based on connection type
      if (!status.isOnline) {
        setConnectionQuality('poor');
      } else if (status.effectiveType === '4g') {
        setConnectionQuality('good');
      } else if (status.effectiveType === '3g') {
        setConnectionQuality('fair');
      } else {
        setConnectionQuality('poor');
      }
    });

    return unsubscribe;
  }, []);

  // Update stats and queue
  useEffect(() => {
    const updateDashboard = async () => {
      try {
        const queue = await indexedDBService.getQueueItems();
        
        // Calculate stats
        const stats: SyncStats = {
          total: queue.length,
          pending: queue.filter((item: SyncQueueRecord) => item.retryCount === 0 && item.status === 'pending').length,
          inProgress: queue.filter((item: SyncQueueRecord) => item.status === 'processing').length,
          succeeded: 0, // From history
          failed: queue.filter((item: SyncQueueRecord) => item.status === 'failed').length,
          retrying: queue.filter((item: SyncQueueRecord) => item.retryCount > 0 && item.status === 'pending').length,
        };

        setSyncStats(stats);

        // Transform queue for visualization
        const visualizations: QueueVisualization[] = queue.map((item: SyncQueueRecord) => ({
          id: item.id?.toString() || '',
          operation: item.operation,
          endpoint: `/api/${item.operation}`,
          priority: 'normal' as const,
          status: item.status === 'processing' ? 'in-progress' : 
                  item.status === 'failed' ? 'failed' : 'pending',
          retryCount: item.retryCount,
          maxRetries: 5,
          addedAt: item.createdAt,
          lastAttempt: item.createdAt, // Use createdAt as fallback
        }));

        setQueueItems(visualizations);
      } catch (error) {
        console.error('Failed to update dashboard:', error);
      }
    };

    // Initial update
    updateDashboard();

    // Poll every 2 seconds
    const interval = setInterval(updateDashboard, 2000);

    return () => clearInterval(interval);
  }, []);

  // Monitor sync activity
  useEffect(() => {
    const checkSyncActivity = () => {
      setIsSyncing(syncStats.inProgress > 0);
    };

    checkSyncActivity();
  }, [syncStats.inProgress]);

  const handleManualSync = async () => {
    const startTime = Date.now();
    try {
      await offlineSyncService.syncAll();
      const duration = Date.now() - startTime;
      
      setLastSyncTime(Date.now());
      setSyncHistory(prev => [
        { timestamp: Date.now(), success: true, itemId: 'manual-sync', duration },
        ...prev.slice(0, 9), // Keep last 10
      ]);
    } catch (error) {
      const duration = Date.now() - startTime;
      setSyncHistory(prev => [
        { timestamp: Date.now(), success: false, itemId: 'manual-sync', duration },
        ...prev.slice(0, 9),
      ]);
      console.error('Manual sync failed:', error);
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="w-5 h-5 text-red-500" />;
    if (connectionQuality === 'good') return <Wifi className="w-5 h-5 text-green-500" />;
    if (connectionQuality === 'fair') return <Wifi className="w-5 h-5 text-yellow-500" />;
    return <Wifi className="w-5 h-5 text-orange-500" />;
  };

  const getConnectionColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (connectionQuality === 'good') return 'bg-green-500';
    if (connectionQuality === 'fair') return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-500';
    if (priority === 'normal') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'in-progress') return <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const calculateSuccessRate = () => {
    if (syncHistory.length === 0) return 100;
    const successful = syncHistory.filter(h => h.success).length;
    return Math.round((successful / syncHistory.length) * 100);
  };

  const calculateAverageDuration = () => {
    if (syncHistory.length === 0) return 0;
    const total = syncHistory.reduce((sum, h) => sum + h.duration, 0);
    return Math.round(total / syncHistory.length);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sync Dashboard</h2>
          <p className="text-slate-400 text-sm">Real-time sync status and queue monitoring</p>
        </div>
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Connection Status */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Network Status
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              {getConnectionIcon()}
              <span className="text-white font-semibold">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className={`h-2 rounded-full ${getConnectionColor()}`} />
          </div>

          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">Quality</div>
            <div className="text-xl font-bold text-white capitalize">
              {connectionQuality || 'Unknown'}
            </div>
          </div>

          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">Connection Type</div>
            <div className="text-xl font-bold text-white uppercase">
              {effectiveType || 'N/A'}
            </div>
          </div>

          <div className="bg-slate-900/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">Last Sync</div>
            <div className="text-xl font-bold text-white">
              {lastSyncTime ? formatTimestamp(lastSyncTime) : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Statistics */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Sync Statistics
        </h3>
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-slate-900/50 rounded p-3">
            <div className="text-sm text-slate-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-white">{syncStats.total}</div>
          </div>

          <div className="bg-slate-900/50 rounded p-3">
            <div className="text-sm text-slate-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">{syncStats.pending}</div>
          </div>

          <div className="bg-slate-900/50 rounded p-3">
            <div className="text-sm text-slate-400 mb-1">In Progress</div>
            <div className="text-2xl font-bold text-blue-400">{syncStats.inProgress}</div>
          </div>

          <div className="bg-slate-900/50 rounded p-3">
            <div className="text-sm text-slate-400 mb-1">Retrying</div>
            <div className="text-2xl font-bold text-orange-400">{syncStats.retrying}</div>
          </div>

          <div className="bg-slate-900/50 rounded p-3">
            <div className="text-sm text-slate-400 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-400">{syncStats.failed}</div>
          </div>

          <div className="bg-slate-900/50 rounded p-3">
            <div className="text-sm text-slate-400 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-400">{calculateSuccessRate()}%</div>
          </div>
        </div>

        {/* Average Duration */}
        <div className="mt-4 bg-slate-900/50 rounded p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Average Sync Duration</span>
            <span className="text-lg font-bold text-white">
              {calculateAverageDuration()}ms
            </span>
          </div>
        </div>
      </div>

      {/* Queue Visualization */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Sync Queue ({queueItems.length} items)
        </h3>

        {queueItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>All synced! No items in queue.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queueItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-slate-900/50 border border-slate-700 rounded p-3 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Priority Indicator */}
                    <div className={`w-1 h-12 rounded ${getPriorityColor(item.priority)}`} />

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(item.status)}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{item.operation}</span>
                        <span className="text-xs text-slate-500">#{index + 1}</span>
                      </div>
                      <div className="text-sm text-slate-400 truncate">
                        {item.endpoint}
                      </div>
                    </div>

                    {/* Retry Info */}
                    <div className="flex items-center gap-2 text-sm">
                      {item.retryCount > 0 && (
                        <div className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">
                          Retry {item.retryCount}/{item.maxRetries}
                        </div>
                      )}
                      {item.priority === 'high' && (
                        <span title="High Priority">
                          <Zap className="w-4 h-4 text-red-400" />
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-slate-500 flex-shrink-0">
                      {formatTimestamp(item.lastAttempt || item.addedAt)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar for In-Progress Items */}
                {item.status === 'in-progress' && (
                  <div className="mt-2">
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sync History */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Sync Activity</h3>
        {syncHistory.length === 0 ? (
          <p className="text-slate-400 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {syncHistory.map((history, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-900/50 rounded p-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  {history.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-slate-300">
                    {history.success ? 'Synced' : 'Failed'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <span>{history.duration}ms</span>
                  <span>{formatTimestamp(history.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warnings */}
      {syncStats.failed > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-300 font-semibold mb-1">Sync Issues Detected</div>
            <div className="text-sm text-red-400">
              {syncStats.failed} item(s) failed to sync after maximum retries. 
              Check your network connection and try again.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
