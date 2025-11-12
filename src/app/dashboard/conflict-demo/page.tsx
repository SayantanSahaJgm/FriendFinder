'use client';

/**
 * Conflict Resolution Demo Page
 * Demonstrates conflict detection and resolution strategies
 */

import { useState } from 'react';
import { useConflictResolution } from '@/hooks/useConflictResolution';
import ConflictResolver from '@/components/offline/ConflictResolver';
import {
  createVersionedData,
  compareVersions,
  type ConflictResolutionStrategy,
} from '@/services/offlineSync/ConflictResolutionService';
import { AlertTriangle, GitMerge, RefreshCw } from 'lucide-react';

export default function ConflictResolutionDemoPage() {
  const {
    conflicts,
    conflictCount,
    hasConflicts,
    resolveConflict,
    autoResolveAll,
    clearConflicts,
  } = useConflictResolution();

  const [showResolver, setShowResolver] = useState(false);
  const [resolutionLog, setResolutionLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setResolutionLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  // Test scenarios
  const createMessageConflict = () => {
    const local = createVersionedData(
      'msg-' + Date.now(),
      {
        text: 'Hello from local device',
        senderId: 'user-1',
        version: 1,
        lastModified: Date.now(),
      },
      'user-1',
      'local'
    );

    const remote = createVersionedData(
      local.id,
      {
        text: 'Hello from server',
        senderId: 'user-1',
        version: 2,
        lastModified: Date.now() - 1000,
      },
      'user-1',
      'remote'
    );

    const conflict = compareVersions(local, remote);
    if (conflict) {
      addLog(`Created message conflict: ${conflict.id}`);
    }
  };

  const createLocationConflict = () => {
    const local = createVersionedData(
      'loc-' + Date.now(),
      {
        latitude: 40.7128,
        longitude: -74.006,
        version: 1,
        lastModified: Date.now(),
      },
      'user-1',
      'local'
    );

    const remote = createVersionedData(
      local.id,
      {
        latitude: 40.7580,
        longitude: -73.9855,
        version: 2,
        lastModified: Date.now() - 2000,
      },
      'user-1',
      'remote'
    );

    const conflict = compareVersions(local, remote);
    if (conflict) {
      addLog(`Created location conflict: ${conflict.id} (auto-resolvable)`);
    }
  };

  const createProfileConflict = () => {
    const local = createVersionedData(
      'profile-' + Date.now(),
      {
        name: 'Alice',
        bio: 'Updated bio from device',
        avatar: 'new-avatar.jpg',
        version: 1,
        lastModified: Date.now(),
      },
      'user-1',
      'local'
    );

    const remote = createVersionedData(
      local.id,
      {
        name: 'Alice',
        bio: 'Updated bio from server',
        status: 'online',
        version: 2,
        lastModified: Date.now() - 1500,
      },
      'user-1',
      'remote'
    );

    const conflict = compareVersions(local, remote);
    if (conflict) {
      addLog(`Created profile conflict: ${conflict.id}`);
    }
  };

  const handleAutoResolve = async () => {
    addLog('Running auto-resolve...');
    const results = await autoResolveAll();
    addLog(`Auto-resolved ${results.length} conflicts`);
    results.forEach((r) => {
      addLog(`  - ${r.strategy}: ${JSON.stringify(r.resolvedData).substring(0, 50)}...`);
    });
  };

  const handleClearAll = () => {
    clearConflicts();
    addLog('Cleared all conflicts');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Conflict Resolution Demo</h1>
          <p className="text-slate-400">
            Test conflict detection and resolution strategies for offline sync
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Conflict Status</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded p-4">
                  <div className="text-2xl font-bold text-white mb-1">{conflictCount}</div>
                  <div className="text-sm text-slate-400">Total Conflicts</div>
                </div>
                <div className="bg-slate-900/50 rounded p-4">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {conflicts.filter((c) => !c.autoResolvable).length}
                  </div>
                  <div className="text-sm text-slate-400">Manual Required</div>
                </div>
                <div className="bg-slate-900/50 rounded p-4">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {conflicts.filter((c) => c.autoResolvable).length}
                  </div>
                  <div className="text-sm text-slate-400">Auto-Resolvable</div>
                </div>
              </div>
            </div>

            {/* Create Conflicts */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Create Test Conflicts</h2>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={createMessageConflict}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                  Message Conflict
                </button>
                <button
                  onClick={createLocationConflict}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
                >
                  Location Conflict
                </button>
                <button
                  onClick={createProfileConflict}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
                >
                  Profile Conflict
                </button>
              </div>

              <div className="mt-4 text-sm text-slate-400 space-y-1">
                <p>• <strong>Message:</strong> Requires manual resolution (content matters)</p>
                <p>• <strong>Location:</strong> Auto-resolvable (uses latest timestamp)</p>
                <p>• <strong>Profile:</strong> Mixed (can merge non-conflicting fields)</p>
              </div>
            </div>

            {/* Resolution Actions */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Resolution Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowResolver(true)}
                  disabled={!hasConflicts}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Open Resolver
                </button>

                <button
                  onClick={handleAutoResolve}
                  disabled={!hasConflicts}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Auto-Resolve
                </button>

                <button
                  onClick={handleClearAll}
                  disabled={!hasConflicts}
                  className="col-span-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white rounded font-medium transition-colors"
                >
                  Clear All Conflicts
                </button>
              </div>
            </div>

            {/* Conflict List */}
            {hasConflicts && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Pending Conflicts ({conflictCount})
                </h2>
                <div className="space-y-3">
                  {conflicts.map((conflict) => (
                    <div
                      key={conflict.id}
                      className="bg-slate-900/50 border border-slate-700 rounded p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white font-semibold capitalize">
                              {conflict.type}
                            </span>
                            {conflict.autoResolvable && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                Auto-resolvable
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-400">
                            Fields: {conflict.conflictFields.join(', ')}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {conflict.id.substring(0, 20)}...
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            addLog(`Resolving ${conflict.id} with merge strategy...`);
                            const result = await resolveConflict(conflict.id, 'merge');
                            addLog(`Resolved: ${result.resolved}`);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          Merge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy Guide */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GitMerge className="w-5 h-5" />
                Resolution Strategies
              </h2>
              <div className="space-y-3 text-sm">
                <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                  <div className="font-semibold text-blue-300 mb-1">Local Wins</div>
                  <div className="text-slate-400">
                    Always use the local (device) version. Good for user preferences.
                  </div>
                </div>

                <div className="bg-green-900/20 border border-green-700 rounded p-3">
                  <div className="font-semibold text-green-300 mb-1">Remote Wins</div>
                  <div className="text-slate-400">
                    Always use the remote (server) version. Good for authoritative data.
                  </div>
                </div>

                <div className="bg-purple-900/20 border border-purple-700 rounded p-3">
                  <div className="font-semibold text-purple-300 mb-1">Latest Wins</div>
                  <div className="text-slate-400">
                    Use the version with the most recent timestamp. Default for auto-resolve.
                  </div>
                </div>

                <div className="bg-orange-900/20 border border-orange-700 rounded p-3">
                  <div className="font-semibold text-orange-300 mb-1">Merge</div>
                  <div className="text-slate-400">
                    Combine both versions, using latest for conflicts. Best for partial updates.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity Log */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Activity Log</h3>
              <div className="bg-slate-900/50 rounded p-3 h-96 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                {resolutionLog.length === 0 ? (
                  <p className="text-slate-500">No activity yet</p>
                ) : (
                  resolutionLog.map((log, i) => (
                    <p key={i} className="text-slate-400">
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Conflict Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Messages:</span>
                  <span className="text-white">
                    {conflicts.filter((c) => c.type === 'message').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Locations:</span>
                  <span className="text-white">
                    {conflicts.filter((c) => c.type === 'location').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Profiles:</span>
                  <span className="text-white">
                    {conflicts.filter((c) => c.type === 'profile').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Friend Requests:</span>
                  <span className="text-white">
                    {conflicts.filter((c) => c.type === 'friendRequest').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Resolver Modal */}
      {showResolver && (
        <ConflictResolver
          onResolve={(id, strategy) => {
            addLog(`Resolved ${id} with ${strategy}`);
          }}
          onDismiss={() => setShowResolver(false)}
          autoResolve={false}
        />
      )}
    </div>
  );
}
