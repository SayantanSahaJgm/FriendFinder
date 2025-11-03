/**
 * Presence Service
 * Tracks user online/offline/away statuses
 */

import { webSocketService } from './WebSocketService';

export type PresenceStatus = 'online' | 'offline' | 'away';

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: number;
  lastActive: number;
}

export interface PresenceUpdate {
  userId: string;
  status: PresenceStatus;
  timestamp: number;
}

type PresenceCallback = (presence: UserPresence) => void;
type BulkPresenceCallback = (presences: Record<string, UserPresence>) => void;

/**
 * Presence Service for tracking user online status
 */
class PresenceService {
  private presences: Map<string, UserPresence> = new Map();
  private presenceListeners: Set<PresenceCallback> = new Set();
  private bulkPresenceListeners: Set<BulkPresenceCallback> = new Set();
  private activityTimer: NodeJS.Timeout | null = null;
  private awayTimer: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private currentUserId: string | null = null;
  private isInitialized = false;

  // Configuration
  private readonly AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
  private readonly ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

  /**
   * Initialize the service
   */
  initialize(userId: string): void {
    if (this.isInitialized) return;

    this.currentUserId = userId;

    // Listen for presence updates
    webSocketService.on('presence:update', this.handlePresenceUpdate);
    webSocketService.on('presence:bulk', this.handleBulkPresence);
    webSocketService.on('user:online', this.handleUserOnline);
    webSocketService.on('user:offline', this.handleUserOffline);

    // Setup activity tracking
    this.setupActivityTracking();

    // Start heartbeat
    this.startHeartbeat();

    // Announce self as online
    this.setStatus('online');

    this.isInitialized = true;
    console.log('[Presence] Service initialized for user:', userId);
  }

  /**
   * Cleanup the service
   */
  destroy(): void {
    webSocketService.off('presence:update', this.handlePresenceUpdate);
    webSocketService.off('presence:bulk', this.handleBulkPresence);
    webSocketService.off('user:online', this.handleUserOnline);
    webSocketService.off('user:offline', this.handleUserOffline);

    this.cleanupActivityTracking();
    this.stopHeartbeat();

    // Announce offline before destroying
    if (this.currentUserId) {
      this.setStatus('offline');
    }

    this.presences.clear();
    this.presenceListeners.clear();
    this.bulkPresenceListeners.clear();

    this.isInitialized = false;
    console.log('[Presence] Service destroyed');
  }

  // ==================== Status Management ====================

  /**
   * Set current user's presence status
   */
  setStatus(status: PresenceStatus): void {
    if (!this.currentUserId) {
      console.warn('[Presence] Cannot set status - no user ID');
      return;
    }

    webSocketService.emit('presence:set', {
      status,
      timestamp: Date.now(),
    });

    // Update local presence
    const presence: UserPresence = {
      userId: this.currentUserId,
      status,
      lastSeen: Date.now(),
      lastActive: Date.now(),
    };

    this.presences.set(this.currentUserId, presence);
    this.notifyPresenceListeners(presence);
  }

  /**
   * Get presence for a specific user
   */
  getPresence(userId: string): UserPresence | null {
    return this.presences.get(userId) || null;
  }

  /**
   * Get all presences
   */
  getAllPresences(): Record<string, UserPresence> {
    const result: Record<string, UserPresence> = {};
    this.presences.forEach((presence, userId) => {
      result[userId] = presence;
    });
    return result;
  }

  /**
   * Request presence for specific users
   */
  requestPresence(userIds: string[]): void {
    webSocketService.emit('presence:request', { userIds });
  }

  // ==================== Activity Tracking ====================

  /**
   * Setup activity tracking
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    // Track user activity
    this.ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, this.handleActivity);
    });

    // Check for away status
    this.startAwayTimer();
  }

  /**
   * Cleanup activity tracking
   */
  private cleanupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    this.ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, this.handleActivity);
    });

    this.stopAwayTimer();
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    this.lastActivityTime = Date.now();

    // Reset away timer
    this.stopAwayTimer();
    this.startAwayTimer();

    // If currently away, set back to online
    const currentPresence = this.currentUserId ? this.presences.get(this.currentUserId) : null;
    if (currentPresence?.status === 'away') {
      this.setStatus('online');
    }
  };

  /**
   * Start away timer
   */
  private startAwayTimer(): void {
    this.awayTimer = setTimeout(() => {
      const timeSinceActivity = Date.now() - this.lastActivityTime;
      if (timeSinceActivity >= this.AWAY_TIMEOUT) {
        this.setStatus('away');
      }
    }, this.AWAY_TIMEOUT);
  }

  /**
   * Stop away timer
   */
  private stopAwayTimer(): void {
    if (this.awayTimer) {
      clearTimeout(this.awayTimer);
      this.awayTimer = null;
    }
  }

  // ==================== Heartbeat ====================

  /**
   * Start presence heartbeat
   */
  private startHeartbeat(): void {
    this.activityTimer = setInterval(() => {
      if (!this.currentUserId) return;

      // Send heartbeat
      webSocketService.emit('presence:heartbeat', {
        timestamp: Date.now(),
        lastActivity: this.lastActivityTime,
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  // ==================== Event Handlers ====================

  /**
   * Handle presence update
   */
  private handlePresenceUpdate = (data: any) => {
    const presence: UserPresence = {
      userId: data.userId,
      status: data.status,
      lastSeen: data.lastSeen || data.timestamp || Date.now(),
      lastActive: data.lastActive || data.timestamp || Date.now(),
    };

    this.presences.set(presence.userId, presence);
    this.notifyPresenceListeners(presence);

    console.log('[Presence] Update:', presence);
  };

  /**
   * Handle bulk presence data
   */
  private handleBulkPresence = (data: any) => {
    const presences: Record<string, UserPresence> = {};

    if (Array.isArray(data.presences)) {
      data.presences.forEach((p: any) => {
        const presence: UserPresence = {
          userId: p.userId,
          status: p.status,
          lastSeen: p.lastSeen || Date.now(),
          lastActive: p.lastActive || Date.now(),
        };
        this.presences.set(presence.userId, presence);
        presences[presence.userId] = presence;
      });
    }

    this.notifyBulkPresenceListeners(presences);
    console.log('[Presence] Bulk update:', Object.keys(presences).length, 'users');
  };

  /**
   * Handle user coming online
   */
  private handleUserOnline = (data: any) => {
    const presence: UserPresence = {
      userId: data.userId,
      status: 'online',
      lastSeen: Date.now(),
      lastActive: Date.now(),
    };

    this.presences.set(presence.userId, presence);
    this.notifyPresenceListeners(presence);

    console.log('[Presence] User online:', presence.userId);
  };

  /**
   * Handle user going offline
   */
  private handleUserOffline = (data: any) => {
    const presence: UserPresence = {
      userId: data.userId,
      status: 'offline',
      lastSeen: data.lastSeen || Date.now(),
      lastActive: data.lastActive || Date.now(),
    };

    this.presences.set(presence.userId, presence);
    this.notifyPresenceListeners(presence);

    console.log('[Presence] User offline:', presence.userId);
  };

  // ==================== Listeners ====================

  /**
   * Notify presence listeners
   */
  private notifyPresenceListeners(presence: UserPresence): void {
    this.presenceListeners.forEach(callback => {
      try {
        callback(presence);
      } catch (error) {
        console.error('[Presence] Error in presence listener:', error);
      }
    });
  }

  /**
   * Notify bulk presence listeners
   */
  private notifyBulkPresenceListeners(presences: Record<string, UserPresence>): void {
    this.bulkPresenceListeners.forEach(callback => {
      try {
        callback(presences);
      } catch (error) {
        console.error('[Presence] Error in bulk presence listener:', error);
      }
    });
  }

  /**
   * Subscribe to presence updates
   */
  onPresenceUpdate(callback: PresenceCallback): () => void {
    this.presenceListeners.add(callback);
    return () => {
      this.presenceListeners.delete(callback);
    };
  }

  /**
   * Subscribe to bulk presence updates
   */
  onBulkPresenceUpdate(callback: BulkPresenceCallback): () => void {
    this.bulkPresenceListeners.add(callback);
    return () => {
      this.bulkPresenceListeners.delete(callback);
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      trackedUsers: this.presences.size,
      presenceListeners: this.presenceListeners.size,
      bulkPresenceListeners: this.bulkPresenceListeners.size,
      lastActivityTime: this.lastActivityTime,
      timeSinceActivity: Date.now() - this.lastActivityTime,
      currentUserId: this.currentUserId,
      isInitialized: this.isInitialized,
    };
  }
}

// Create singleton instance
export const presenceService = new PresenceService();

export default presenceService;
