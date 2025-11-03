/**
 * useConflictResolution Hook
 * React hook for managing data conflicts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  conflictResolutionService,
  type ConflictInfo,
  type ConflictResolutionStrategy,
  type ConflictResolutionResult,
} from '@/services/offlineSync/ConflictResolutionService';

export interface UseConflictResolutionResult {
  conflicts: ConflictInfo[];
  conflictCount: number;
  hasConflicts: boolean;
  resolveConflict: (
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    manualResolution?: any
  ) => Promise<ConflictResolutionResult>;
  autoResolveAll: () => Promise<ConflictResolutionResult[]>;
  resolveAll: (strategy: ConflictResolutionStrategy) => Promise<void>;
  clearConflicts: () => void;
  getConflictsByType: (type: ConflictInfo['type']) => ConflictInfo[];
}

/**
 * Hook for conflict resolution management
 */
export function useConflictResolution(): UseConflictResolutionResult {
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);

  // Load conflicts and subscribe to updates
  useEffect(() => {
    // Initial load
    setConflicts(conflictResolutionService.getPendingConflicts());

    // Subscribe to new conflicts
    const unsubscribe = conflictResolutionService.onConflict((conflict) => {
      console.log('[useConflictResolution] New conflict detected:', conflict.id);
      setConflicts(conflictResolutionService.getPendingConflicts());
    });

    return () => unsubscribe();
  }, []);

  /**
   * Resolve a single conflict
   */
  const resolveConflict = useCallback(
    async (
      conflictId: string,
      strategy: ConflictResolutionStrategy,
      manualResolution?: any
    ): Promise<ConflictResolutionResult> => {
      const result = await conflictResolutionService.resolveConflict(
        conflictId,
        strategy,
        manualResolution
      );

      if (result.resolved) {
        setConflicts(conflictResolutionService.getPendingConflicts());
      }

      return result;
    },
    []
  );

  /**
   * Auto-resolve all resolvable conflicts
   */
  const autoResolveAll = useCallback(async (): Promise<ConflictResolutionResult[]> => {
    const results = await conflictResolutionService.autoResolveConflicts();
    setConflicts(conflictResolutionService.getPendingConflicts());
    return results;
  }, []);

  /**
   * Resolve all conflicts with a specific strategy
   */
  const resolveAll = useCallback(
    async (strategy: ConflictResolutionStrategy): Promise<void> => {
      const conflictIds = conflicts.map((c) => c.id);

      for (const id of conflictIds) {
        await conflictResolutionService.resolveConflict(id, strategy);
      }

      setConflicts(conflictResolutionService.getPendingConflicts());
    },
    [conflicts]
  );

  /**
   * Clear all conflicts without resolving
   */
  const clearConflicts = useCallback((): void => {
    conflictResolutionService.clearConflicts();
    setConflicts([]);
  }, []);

  /**
   * Get conflicts by type
   */
  const getConflictsByType = useCallback(
    (type: ConflictInfo['type']): ConflictInfo[] => {
      return conflicts.filter((c) => c.type === type);
    },
    [conflicts]
  );

  return {
    conflicts,
    conflictCount: conflicts.length,
    hasConflicts: conflicts.length > 0,
    resolveConflict,
    autoResolveAll,
    resolveAll,
    clearConflicts,
    getConflictsByType,
  };
}

console.log('[useConflictResolution] Hook loaded');
