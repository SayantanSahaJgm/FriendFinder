'use client';

/**
 * ConflictResolver Component
 * UI for resolving data conflicts between offline and online versions
 */

import { useState, useEffect } from 'react';
import {
  conflictResolutionService,
  type ConflictInfo,
  type ConflictResolutionStrategy,
} from '@/services/offlineSync/ConflictResolutionService';
import { AlertTriangle, Check, X, GitMerge, Clock, User } from 'lucide-react';

export interface ConflictResolverProps {
  onResolve?: (conflictId: string, strategy: ConflictResolutionStrategy) => void;
  onDismiss?: () => void;
  autoResolve?: boolean;
}

export default function ConflictResolver({
  onResolve,
  onDismiss,
  autoResolve = true,
}: ConflictResolverProps) {
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictInfo | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    // Load initial conflicts
    setConflicts(conflictResolutionService.getPendingConflicts());

    // Listen for new conflicts
    const unsubscribe = conflictResolutionService.onConflict((conflict) => {
      setConflicts((prev) => [...prev, conflict]);
    });

    // Auto-resolve if enabled
    if (autoResolve) {
      conflictResolutionService.autoResolveConflicts().then((results) => {
        console.log('[ConflictResolver] Auto-resolved:', results.length);
        setConflicts(conflictResolutionService.getPendingConflicts());
      });
    }

    return () => unsubscribe();
  }, [autoResolve]);

  const handleResolve = async (
    conflictId: string,
    strategy: ConflictResolutionStrategy
  ) => {
    setResolving(true);

    try {
      const result = await conflictResolutionService.resolveConflict(conflictId, strategy);

      if (result.resolved) {
        setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
        setSelectedConflict(null);
        onResolve?.(conflictId, strategy);
      }
    } catch (error) {
      console.error('[ConflictResolver] Resolution failed:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleResolveAll = async (strategy: ConflictResolutionStrategy) => {
    setResolving(true);

    try {
      const conflictIds = conflicts.map((c) => c.id);

      for (const id of conflictIds) {
        await conflictResolutionService.resolveConflict(id, strategy);
      }

      setConflicts([]);
      setSelectedConflict(null);
    } catch (error) {
      console.error('[ConflictResolver] Bulk resolution failed:', error);
    } finally {
      setResolving(false);
    }
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Data Conflicts Detected</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need
                  {conflicts.length !== 1 ? '' : 's'} resolution
                </p>
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedConflict ? (
            /* Detailed View */
            <div className="space-y-6">
              <button
                onClick={() => setSelectedConflict(null)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                ← Back to list
              </button>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Conflict Details
                  </h3>
                  <div className="bg-slate-900/50 rounded p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white capitalize">{selectedConflict.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Conflicting Fields:</span>
                      <span className="text-white">
                        {selectedConflict.conflictFields.join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Auto-Resolvable:</span>
                      <span
                        className={
                          selectedConflict.autoResolvable ? 'text-green-400' : 'text-red-400'
                        }
                      >
                        {selectedConflict.autoResolvable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Local Version */}
                <div>
                  <h4 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Local Version (Your Changes)
                  </h4>
                  <div className="bg-blue-900/20 border border-blue-700 rounded p-4">
                    <div className="text-xs text-slate-400 mb-2">
                      Modified: {new Date(selectedConflict.localVersion.lastModified).toLocaleString()}
                    </div>
                    <pre className="text-sm text-white overflow-x-auto">
                      {JSON.stringify(selectedConflict.localVersion.data, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Remote Version */}
                <div>
                  <h4 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Remote Version (Server)
                  </h4>
                  <div className="bg-green-900/20 border border-green-700 rounded p-4">
                    <div className="text-xs text-slate-400 mb-2">
                      Modified: {new Date(selectedConflict.remoteVersion.lastModified).toLocaleString()}
                    </div>
                    <pre className="text-sm text-white overflow-x-auto">
                      {JSON.stringify(selectedConflict.remoteVersion.data, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Resolution Options */}
                <div>
                  <h4 className="text-md font-semibold text-white mb-3">Choose Resolution</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleResolve(selectedConflict.id, 'local-wins')}
                      disabled={resolving}
                      className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      <div className="font-semibold mb-1">Keep Local</div>
                      <div className="text-xs opacity-75">Use your changes</div>
                    </button>

                    <button
                      onClick={() => handleResolve(selectedConflict.id, 'remote-wins')}
                      disabled={resolving}
                      className="p-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      <div className="font-semibold mb-1">Keep Remote</div>
                      <div className="text-xs opacity-75">Use server version</div>
                    </button>

                    <button
                      onClick={() => handleResolve(selectedConflict.id, 'latest-wins')}
                      disabled={resolving}
                      className="p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      <div className="font-semibold mb-1">Latest Wins</div>
                      <div className="text-xs opacity-75">Use most recent</div>
                    </button>

                    <button
                      onClick={() => handleResolve(selectedConflict.id, 'merge')}
                      disabled={resolving}
                      className="p-4 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      <div className="font-semibold mb-1 flex items-center gap-2">
                        <GitMerge className="w-4 h-4" />
                        Merge
                      </div>
                      <div className="text-xs opacity-75">Combine changes</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedConflict(conflict)}
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
                        Conflicting fields: {conflict.conflictFields.join(', ')}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Local: {new Date(conflict.localVersion.lastModified).toLocaleString()} |
                        Remote: {new Date(conflict.remoteVersion.lastModified).toLocaleString()}
                      </div>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 transition-colors">
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!selectedConflict && (
          <div className="p-6 border-t border-slate-700 bg-slate-900/50">
            <div className="flex gap-3">
              <button
                onClick={() => handleResolveAll('latest-wins')}
                disabled={resolving}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                {resolving ? 'Resolving...' : 'Resolve All (Latest Wins)'}
              </button>
              <button
                onClick={() => handleResolveAll('merge')}
                disabled={resolving}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                {resolving ? 'Resolving...' : 'Merge All'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

console.log('[ConflictResolver] Component loaded');
