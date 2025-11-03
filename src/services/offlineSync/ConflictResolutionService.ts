/**
 * Conflict Resolution Service
 * Handles conflicts between offline and online data versions
 */

export interface VersionedData {
  id: string;
  data: any;
  version: number;
  lastModified: number; // timestamp
  modifiedBy: string; // userId
  origin: 'local' | 'remote';
}

export interface ConflictInfo {
  id: string;
  type: 'message' | 'profile' | 'location' | 'friendRequest';
  localVersion: VersionedData;
  remoteVersion: VersionedData;
  conflictFields: string[];
  autoResolvable: boolean;
}

export type ConflictResolutionStrategy = 
  | 'local-wins'      // Keep local version
  | 'remote-wins'     // Keep remote version
  | 'latest-wins'     // Use most recent timestamp
  | 'merge'           // Merge non-conflicting fields
  | 'manual';         // Require user decision

export interface ConflictResolutionResult {
  resolved: boolean;
  strategy: ConflictResolutionStrategy;
  resolvedData: any;
  conflicts?: ConflictInfo[];
}

class ConflictResolutionService {
  private conflicts: Map<string, ConflictInfo> = new Map();
  private listeners: Set<(conflict: ConflictInfo) => void> = new Set();

  /**
   * Detect conflicts between local and remote data
   */
  detectConflict(
    localData: VersionedData,
    remoteData: VersionedData
  ): ConflictInfo | null {
    // No conflict if versions match
    if (localData.version === remoteData.version) {
      return null;
    }

    // No conflict if data is identical
    if (JSON.stringify(localData.data) === JSON.stringify(remoteData.data)) {
      return null;
    }

    // Find conflicting fields
    const conflictFields = this.findConflictingFields(
      localData.data,
      remoteData.data
    );

    if (conflictFields.length === 0) {
      return null;
    }

    const conflict: ConflictInfo = {
      id: localData.id,
      type: this.inferType(localData.data),
      localVersion: localData,
      remoteVersion: remoteData,
      conflictFields,
      autoResolvable: this.isAutoResolvable(conflictFields, localData.data),
    };

    // Store conflict
    this.conflicts.set(localData.id, conflict);

    // Notify listeners
    this.notifyListeners(conflict);

    return conflict;
  }

  /**
   * Resolve a conflict using specified strategy
   */
  async resolveConflict(
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    manualResolution?: any
  ): Promise<ConflictResolutionResult> {
    const conflict = this.conflicts.get(conflictId);

    if (!conflict) {
      return {
        resolved: false,
        strategy,
        resolvedData: null,
      };
    }

    let resolvedData: any;

    switch (strategy) {
      case 'local-wins':
        resolvedData = conflict.localVersion.data;
        break;

      case 'remote-wins':
        resolvedData = conflict.remoteVersion.data;
        break;

      case 'latest-wins':
        resolvedData = this.resolveByTimestamp(conflict);
        break;

      case 'merge':
        resolvedData = this.mergeData(conflict);
        break;

      case 'manual':
        if (!manualResolution) {
          throw new Error('Manual resolution required but not provided');
        }
        resolvedData = manualResolution;
        break;

      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }

    // Remove from conflicts
    this.conflicts.delete(conflictId);

    return {
      resolved: true,
      strategy,
      resolvedData,
    };
  }

  /**
   * Auto-resolve conflicts that don't require user input
   */
  async autoResolveConflicts(): Promise<ConflictResolutionResult[]> {
    const results: ConflictResolutionResult[] = [];

    for (const [id, conflict] of this.conflicts.entries()) {
      if (conflict.autoResolvable) {
        const strategy = this.determineAutoStrategy(conflict);
        const result = await this.resolveConflict(id, strategy);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get all pending conflicts
   */
  getPendingConflicts(): ConflictInfo[] {
    return Array.from(this.conflicts.values());
  }

  /**
   * Get conflicts by type
   */
  getConflictsByType(type: ConflictInfo['type']): ConflictInfo[] {
    return this.getPendingConflicts().filter((c) => c.type === type);
  }

  /**
   * Listen for new conflicts
   */
  onConflict(callback: (conflict: ConflictInfo) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Clear all conflicts
   */
  clearConflicts(): void {
    this.conflicts.clear();
  }

  // ==================== Private Methods ====================

  /**
   * Find fields that differ between local and remote
   */
  private findConflictingFields(local: any, remote: any): string[] {
    const conflicts: string[] = [];

    const allKeys = new Set([
      ...Object.keys(local || {}),
      ...Object.keys(remote || {}),
    ]);

    for (const key of allKeys) {
      // Skip metadata fields
      if (['_id', 'id', 'version', 'lastModified', 'modifiedBy'].includes(key)) {
        continue;
      }

      const localValue = local[key];
      const remoteValue = remote[key];

      // Check if values differ
      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        conflicts.push(key);
      }
    }

    return conflicts;
  }

  /**
   * Determine if conflict can be auto-resolved
   */
  private isAutoResolvable(fields: string[], data: any): boolean {
    // Messages are not auto-resolvable (content matters)
    if (data.text || data.message) {
      return false;
    }

    // Profile picture/avatar changes are auto-resolvable
    if (fields.every((f) => ['avatar', 'profilePicture', 'photo'].includes(f))) {
      return true;
    }

    // Location updates are auto-resolvable (use latest)
    if (fields.every((f) => ['latitude', 'longitude', 'location'].includes(f))) {
      return true;
    }

    // Status changes are auto-resolvable
    if (fields.every((f) => ['status', 'online', 'lastSeen'].includes(f))) {
      return true;
    }

    // Single field conflicts are usually auto-resolvable
    return fields.length === 1;
  }

  /**
   * Determine strategy for auto-resolution
   */
  private determineAutoStrategy(conflict: ConflictInfo): ConflictResolutionStrategy {
    const { conflictFields, localVersion, remoteVersion } = conflict;

    // Location: use latest
    if (conflictFields.every((f) => ['latitude', 'longitude', 'location'].includes(f))) {
      return 'latest-wins';
    }

    // Status: use latest
    if (conflictFields.every((f) => ['status', 'online', 'lastSeen'].includes(f))) {
      return 'latest-wins';
    }

    // Single field: merge if possible, else latest
    if (conflictFields.length === 1) {
      return 'merge';
    }

    // Default: latest wins
    return 'latest-wins';
  }

  /**
   * Resolve by comparing timestamps
   */
  private resolveByTimestamp(conflict: ConflictInfo): any {
    const { localVersion, remoteVersion } = conflict;

    return localVersion.lastModified > remoteVersion.lastModified
      ? localVersion.data
      : remoteVersion.data;
  }

  /**
   * Merge non-conflicting fields
   */
  private mergeData(conflict: ConflictInfo): any {
    const { localVersion, remoteVersion, conflictFields } = conflict;

    // Start with remote data (base)
    const merged = { ...remoteVersion.data };

    // For each field, decide which to keep
    for (const key of Object.keys(localVersion.data)) {
      if (conflictFields.includes(key)) {
        // Conflicting field: use latest timestamp
        merged[key] =
          localVersion.lastModified > remoteVersion.lastModified
            ? localVersion.data[key]
            : remoteVersion.data[key];
      } else {
        // Non-conflicting: prefer local (more recent)
        merged[key] = localVersion.data[key];
      }
    }

    return merged;
  }

  /**
   * Infer data type from structure
   */
  private inferType(data: any): ConflictInfo['type'] {
    if (data.text || data.message || data.content) return 'message';
    if (data.latitude && data.longitude) return 'location';
    if (data.status === 'pending' || data.requesterId) return 'friendRequest';
    return 'profile';
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(conflict: ConflictInfo): void {
    this.listeners.forEach((listener) => {
      try {
        listener(conflict);
      } catch (error) {
        console.error('[ConflictResolution] Listener error:', error);
      }
    });
  }
}

// Singleton instance
export const conflictResolutionService = new ConflictResolutionService();

/**
 * Create versioned data wrapper
 */
export function createVersionedData(
  id: string,
  data: any,
  userId: string,
  origin: 'local' | 'remote' = 'local'
): VersionedData {
  return {
    id,
    data,
    version: data.version || 1,
    lastModified: data.lastModified || Date.now(),
    modifiedBy: userId,
    origin,
  };
}

/**
 * Compare two versions and detect conflicts
 */
export function compareVersions(
  local: VersionedData,
  remote: VersionedData
): ConflictInfo | null {
  return conflictResolutionService.detectConflict(local, remote);
}

console.log('[ConflictResolutionService] Loaded');
