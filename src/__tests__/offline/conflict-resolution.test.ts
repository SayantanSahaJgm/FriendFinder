/**
 * Conflict Resolution Tests
 * Tests for conflict detection and resolution strategies
 */

import {
  conflictResolutionService,
  createVersionedData,
  compareVersions,
  type VersionedData,
  type ConflictInfo,
} from '@/services/offlineSync/ConflictResolutionService';

describe('ConflictResolutionService', () => {
  beforeEach(() => {
    // Clear all conflicts before each test
    conflictResolutionService.clearConflicts();
  });

  describe('Conflict Detection', () => {
    it('should detect conflicts when versions differ', () => {
      const local = createVersionedData(
        'msg-1',
        { text: 'Hello local', version: 1, lastModified: 1000 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'msg-1',
        { text: 'Hello remote', version: 2, lastModified: 2000 },
        'user-2',
        'remote'
      );

      const conflict = compareVersions(local, remote);

      expect(conflict).not.toBeNull();
      expect(conflict?.conflictFields).toContain('text');
    });

    it('should not detect conflicts when data is identical', () => {
      const local = createVersionedData(
        'msg-1',
        { text: 'Hello', version: 1, lastModified: 1000 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'msg-1',
        { text: 'Hello', version: 2, lastModified: 2000 },
        'user-1',
        'remote'
      );

      const conflict = compareVersions(local, remote);

      expect(conflict).toBeNull();
    });

    it('should identify conflicting fields', () => {
      const local = createVersionedData(
        'profile-1',
        { name: 'Alice', bio: 'Local bio', version: 1 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'profile-1',
        { name: 'Alice', bio: 'Remote bio', version: 2 },
        'user-1',
        'remote'
      );

      const conflict = compareVersions(local, remote);

      expect(conflict).not.toBeNull();
      expect(conflict?.conflictFields).toEqual(['bio']);
      expect(conflict?.conflictFields).not.toContain('name');
    });

    it('should mark location conflicts as auto-resolvable', () => {
      const local = createVersionedData(
        'loc-1',
        { latitude: 40.7128, longitude: -74.006, version: 1 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'loc-1',
        { latitude: 40.7580, longitude: -73.9855, version: 2 },
        'user-1',
        'remote'
      );

      const conflict = compareVersions(local, remote);

      expect(conflict).not.toBeNull();
      expect(conflict?.autoResolvable).toBe(true);
    });

    it('should mark message conflicts as not auto-resolvable', () => {
      const local = createVersionedData(
        'msg-1',
        { text: 'Hello world', version: 1 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'msg-1',
        { text: 'Hi there', version: 2 },
        'user-1',
        'remote'
      );

      const conflict = compareVersions(local, remote);

      expect(conflict).not.toBeNull();
      expect(conflict?.autoResolvable).toBe(false);
    });
  });

  describe('Resolution Strategies', () => {
    it('should resolve with local-wins strategy', async () => {
      const local = createVersionedData(
        'msg-1',
        { text: 'Local', version: 1 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'msg-1',
        { text: 'Remote', version: 2 },
        'user-1',
        'remote'
      );

      compareVersions(local, remote);

      const result = await conflictResolutionService.resolveConflict('msg-1', 'local-wins');

      expect(result.resolved).toBe(true);
      expect(result.resolvedData.text).toBe('Local');
    });

    it('should resolve with remote-wins strategy', async () => {
      const local = createVersionedData(
        'msg-1',
        { text: 'Local', version: 1 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'msg-1',
        { text: 'Remote', version: 2 },
        'user-1',
        'remote'
      );

      compareVersions(local, remote);

      const result = await conflictResolutionService.resolveConflict('msg-1', 'remote-wins');

      expect(result.resolved).toBe(true);
      expect(result.resolvedData.text).toBe('Remote');
    });

    it('should resolve with latest-wins strategy', async () => {
      const local = createVersionedData(
        'msg-1',
        { text: 'Local', version: 1, lastModified: 2000 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'msg-1',
        { text: 'Remote', version: 2, lastModified: 1000 },
        'user-1',
        'remote'
      );

      compareVersions(local, remote);

      const result = await conflictResolutionService.resolveConflict('msg-1', 'latest-wins');

      expect(result.resolved).toBe(true);
      expect(result.resolvedData.text).toBe('Local'); // Local is newer
    });

    it('should merge non-conflicting fields', async () => {
      const local = createVersionedData(
        'profile-1',
        { name: 'Alice', bio: 'Local bio', avatar: 'local.jpg', lastModified: 2000 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'profile-1',
        { name: 'Alice', bio: 'Remote bio', status: 'online', lastModified: 1000 },
        'user-1',
        'remote'
      );

      compareVersions(local, remote);

      const result = await conflictResolutionService.resolveConflict('profile-1', 'merge');

      expect(result.resolved).toBe(true);
      expect(result.resolvedData.name).toBe('Alice');
      expect(result.resolvedData.avatar).toBe('local.jpg'); // Local only
      expect(result.resolvedData.status).toBe('online'); // Remote only
      expect(result.resolvedData.bio).toBe('Local bio'); // Latest wins for conflict
    });

    it('should handle manual resolution', async () => {
      const local = createVersionedData(
        'msg-1',
        { text: 'Local', version: 1 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'msg-1',
        { text: 'Remote', version: 2 },
        'user-1',
        'remote'
      );

      compareVersions(local, remote);

      const manualData = { text: 'Manually resolved', version: 3 };
      const result = await conflictResolutionService.resolveConflict(
        'msg-1',
        'manual',
        manualData
      );

      expect(result.resolved).toBe(true);
      expect(result.resolvedData.text).toBe('Manually resolved');
    });
  });

  describe('Auto-Resolution', () => {
    it('should auto-resolve location conflicts', async () => {
      const local = createVersionedData(
        'loc-1',
        { latitude: 40.7128, longitude: -74.006, lastModified: 2000 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'loc-1',
        { latitude: 40.7580, longitude: -73.9855, lastModified: 1000 },
        'user-1',
        'remote'
      );

      compareVersions(local, remote);

      const results = await conflictResolutionService.autoResolveConflicts();

      expect(results.length).toBe(1);
      expect(results[0].resolved).toBe(true);
      expect(results[0].resolvedData.latitude).toBe(40.7128); // Latest
    });

    it('should not auto-resolve message conflicts', async () => {
      const local = createVersionedData(
        'msg-1',
        { text: 'Local message', version: 1 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'msg-1',
        { text: 'Remote message', version: 2 },
        'user-1',
        'remote'
      );

      compareVersions(local, remote);

      const results = await conflictResolutionService.autoResolveConflicts();

      expect(results.length).toBe(0); // Not auto-resolved
      expect(conflictResolutionService.getPendingConflicts().length).toBe(1);
    });

    it('should auto-resolve status conflicts', async () => {
      const local = createVersionedData(
        'user-1',
        { status: 'online', lastModified: 2000 },
        'user-1',
        'local'
      );

      const remote = createVersionedData(
        'user-1',
        { status: 'offline', lastModified: 1000 },
        'user-1',
        'remote'
      );

      compareVersions(local, remote);

      const results = await conflictResolutionService.autoResolveConflicts();

      expect(results.length).toBe(1);
      expect(results[0].resolvedData.status).toBe('online'); // Latest
    });
  });

  describe('Conflict Management', () => {
    it('should get pending conflicts', () => {
      const local1 = createVersionedData('msg-1', { text: 'A' }, 'user-1', 'local');
      const remote1 = createVersionedData('msg-1', { text: 'B' }, 'user-1', 'remote');

      const local2 = createVersionedData('msg-2', { text: 'C' }, 'user-1', 'local');
      const remote2 = createVersionedData('msg-2', { text: 'D' }, 'user-1', 'remote');

      compareVersions(local1, remote1);
      compareVersions(local2, remote2);

      const pending = conflictResolutionService.getPendingConflicts();

      expect(pending.length).toBe(2);
    });

    it('should get conflicts by type', () => {
      const local1 = createVersionedData(
        'msg-1',
        { text: 'Message' },
        'user-1',
        'local'
      );
      const remote1 = createVersionedData(
        'msg-1',
        { text: 'Different' },
        'user-1',
        'remote'
      );

      const local2 = createVersionedData(
        'loc-1',
        { latitude: 1, longitude: 1 },
        'user-1',
        'local'
      );
      const remote2 = createVersionedData(
        'loc-1',
        { latitude: 2, longitude: 2 },
        'user-1',
        'remote'
      );

      compareVersions(local1, remote1);
      compareVersions(local2, remote2);

      const messageConflicts = conflictResolutionService.getConflictsByType('message');
      const locationConflicts = conflictResolutionService.getConflictsByType('location');

      expect(messageConflicts.length).toBe(1);
      expect(locationConflicts.length).toBe(1);
    });

    it('should clear all conflicts', () => {
      const local = createVersionedData('msg-1', { text: 'A' }, 'user-1', 'local');
      const remote = createVersionedData('msg-1', { text: 'B' }, 'user-1', 'remote');

      compareVersions(local, remote);

      expect(conflictResolutionService.getPendingConflicts().length).toBe(1);

      conflictResolutionService.clearConflicts();

      expect(conflictResolutionService.getPendingConflicts().length).toBe(0);
    });

    it('should notify listeners on new conflicts', () => {
      const listener = jest.fn();
      const unsubscribe = conflictResolutionService.onConflict(listener);

      const local = createVersionedData('msg-1', { text: 'A' }, 'user-1', 'local');
      const remote = createVersionedData('msg-1', { text: 'B' }, 'user-1', 'remote');

      compareVersions(local, remote);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg-1',
          type: 'message',
        })
      );

      unsubscribe();
    });
  });

  describe('Type Inference', () => {
    it('should infer message type', () => {
      const local = createVersionedData(
        'msg-1',
        { text: 'Hello', senderId: 'user-1' },
        'user-1',
        'local'
      );
      const remote = createVersionedData(
        'msg-1',
        { text: 'Hi', senderId: 'user-1' },
        'user-1',
        'remote'
      );

      const conflict = compareVersions(local, remote);

      expect(conflict?.type).toBe('message');
    });

    it('should infer location type', () => {
      const local = createVersionedData(
        'loc-1',
        { latitude: 1, longitude: 1 },
        'user-1',
        'local'
      );
      const remote = createVersionedData(
        'loc-1',
        { latitude: 2, longitude: 2 },
        'user-1',
        'remote'
      );

      const conflict = compareVersions(local, remote);

      expect(conflict?.type).toBe('location');
    });

    it('should infer profile type', () => {
      const local = createVersionedData(
        'profile-1',
        { name: 'Alice', bio: 'A' },
        'user-1',
        'local'
      );
      const remote = createVersionedData(
        'profile-1',
        { name: 'Alice', bio: 'B' },
        'user-1',
        'remote'
      );

      const conflict = compareVersions(local, remote);

      expect(conflict?.type).toBe('profile');
    });
  });
});

console.log('[Conflict Resolution Tests] Loaded');
