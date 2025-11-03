'use client';

/**
 * Queue Manager Component
 * Advanced queue management with manual controls
 */

import { useState, useEffect } from 'react';
import { indexedDBService, type SyncQueueRecord } from '@/services/offlineSync/IndexedDBService';
import {
  Trash2,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Filter,
  Search,
  X,
} from 'lucide-react';

type FilterType = 'all' | 'pending' | 'retrying' | 'failed';
type SortType = 'timestamp' | 'priority' | 'retries';

export default function QueueManager() {
  const [queueItems, setQueueItems] = useState<SyncQueueRecord[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('timestamp');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState('');

  // Load queue items
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const items = await offlineSyncService.getQueueItems();
      setQueueItems(items);
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  };

  // Filter items
  const filteredItems = queueItems
    .filter(item => {
      // Apply filter
      if (filter === 'pending' && item.retryCount !== 0) return false;
      if (filter === 'retrying' && (item.retryCount === 0 || item.retryCount >= item.maxRetries)) return false;
      if (filter === 'failed' && item.retryCount < item.maxRetries) return false;

      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.operation.toLowerCase().includes(query) ||
          item.endpoint.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'timestamp') return b.timestamp - a.timestamp;
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (sortBy === 'retries') return b.retryCount - a.retryCount;
      return 0;
    });

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleRemoveSelected = async () => {
    if (!confirm(`Remove ${selectedItems.size} item(s) from queue?`)) return;

    for (const id of selectedItems) {
      await offlineSyncService.removeFromQueue(id);
    }

    setSelectedItems(new Set());
    await loadQueue();
  };

  const handleClearQueue = async () => {
    if (!confirm('Clear entire queue? This cannot be undone.')) return;

    await offlineSyncService.clearQueue();
    setSelectedItems(new Set());
    await loadQueue();
  };

  const handleExportQueue = () => {
    const data = JSON.stringify(queueItems, null, 2);
    setExportData(data);
    setShowExport(true);
  };

  const handleDownloadExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-queue-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportQueue = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const items: SyncQueueItem[] = JSON.parse(text);

      if (!Array.isArray(items)) {
        throw new Error('Invalid format');
      }

      // Re-add items to queue
      for (const item of items) {
        await offlineSyncService.addToQueue(
          item.id,
          item.operation,
          item.endpoint,
          item.data,
          item.priority
        );
      }

      await loadQueue();
      alert(`Imported ${items.length} item(s)`);
    } catch (error) {
      alert('Failed to import queue: ' + (error as Error).message);
    }
  };

  const getStatusBadge = (item: SyncQueueItem) => {
    if (item.syncing) {
      return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">In Progress</span>;
    }
    if (item.retryCount >= item.maxRetries) {
      return <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Failed</span>;
    }
    if (item.retryCount > 0) {
      return <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Retrying</span>;
    }
    return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Pending</span>;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Queue Manager</h2>
          <p className="text-slate-400 text-sm">Manage sync queue items manually</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportQueue}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExportQueue}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queue..."
                className="w-full pl-10 pr-10 py-2 bg-slate-900/50 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter */}
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Items</option>
              <option value="pending">Pending Only</option>
              <option value="retrying">Retrying Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
            >
              <option value="timestamp">Sort by Time</option>
              <option value="priority">Sort by Priority</option>
              <option value="retries">Sort by Retries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-300 font-semibold">
            {selectedItems.size} item(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemoveSelected}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove Selected
            </button>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Queue Items ({filteredItems.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleClearQueue}
              disabled={queueItems.length === 0}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white rounded text-sm font-medium transition-colors"
            >
              Clear Queue
            </button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>No items in queue</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900/50 border rounded p-4 transition-colors ${
                  selectedItems.has(item.id)
                    ? 'border-blue-500 bg-blue-900/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />

                  {/* Priority Indicator */}
                  <div
                    className={`w-1 h-full rounded ${
                      item.priority === 'high'
                        ? 'bg-red-500'
                        : item.priority === 'normal'
                        ? 'bg-blue-500'
                        : 'bg-gray-500'
                    }`}
                  />

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-semibold">{item.operation}</span>
                      {getStatusBadge(item)}
                      {item.priority === 'high' && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                          High Priority
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-slate-400 mb-2">{item.endpoint}</div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="font-semibold">Added:</span> {formatTimestamp(item.timestamp)}
                      </div>
                      {item.lastRetryAt && (
                        <div>
                          <span className="font-semibold">Last Retry:</span>{' '}
                          {formatTimestamp(item.lastRetryAt)}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Retries:</span> {item.retryCount}/{item.maxRetries}
                      </div>
                      <div>
                        <span className="font-semibold">ID:</span> {item.id.substring(0, 12)}...
                      </div>
                    </div>

                    {/* Data Preview */}
                    <details className="mt-2">
                      <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                        View Data
                      </summary>
                      <pre className="mt-2 p-2 bg-slate-800 rounded text-xs text-slate-300 overflow-x-auto">
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    </details>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={async () => {
                        await offlineSyncService.removeFromQueue(item.id);
                        await loadQueue();
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Export Queue Data</h3>
              <button
                onClick={() => setShowExport(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="flex-1 overflow-auto p-4 bg-slate-900 rounded text-xs text-slate-300 font-mono">
              {exportData}
            </pre>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleDownloadExport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportData);
                  alert('Copied to clipboard!');
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
