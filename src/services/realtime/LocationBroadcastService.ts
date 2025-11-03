/**
 * Location Broadcast Service
 * Handles real-time location sharing with throttling and privacy controls
 */

import { webSocketService } from './WebSocketService';

export interface LocationData {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  geohash?: string;
}

export interface LocationUpdate extends LocationData {
  heading?: number;
  speed?: number;
  altitude?: number;
}

export interface LocationPrivacySettings {
  enabled: boolean;
  shareWithAll: boolean;
  shareWithFriends: boolean;
  shareWithSpecificUsers: string[];
  precision: 'exact' | 'approximate' | 'city';
}

type LocationUpdateCallback = (location: LocationUpdate) => void;
type BulkLocationCallback = (locations: Record<string, LocationUpdate>) => void;

/**
 * Service for broadcasting and receiving real-time location updates
 */
class LocationBroadcastService {
  private currentLocation: LocationUpdate | null = null;
  private locationListeners: Set<LocationUpdateCallback> = new Set();
  private bulkLocationListeners: Set<BulkLocationCallback> = new Set();
  private otherUsersLocations: Map<string, LocationUpdate> = new Map();
  private watchId: number | null = null;
  private lastBroadcastTime = 0;
  private currentUserId: string | null = null;
  private isInitialized = false;

  // Privacy settings
  private privacySettings: LocationPrivacySettings = {
    enabled: true,
    shareWithAll: false,
    shareWithFriends: true,
    shareWithSpecificUsers: [],
    precision: 'approximate',
  };

  // Configuration
  private readonly THROTTLE_INTERVAL = 5000; // 5 seconds
  private readonly MIN_DISTANCE_CHANGE = 10; // 10 meters
  private readonly LOCATION_TIMEOUT = 60000; // 1 minute - consider stale
  private readonly GEOLOCATION_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
  };

  /**
   * Initialize the service
   */
  initialize(userId: string, privacySettings?: Partial<LocationPrivacySettings>): void {
    if (this.isInitialized) return;

    this.currentUserId = userId;

    // Update privacy settings
    if (privacySettings) {
      this.privacySettings = { ...this.privacySettings, ...privacySettings };
    }

    // Listen for location updates from other users
    webSocketService.on('location:update', this.handleLocationUpdate);
    webSocketService.on('location:bulk', this.handleBulkLocation);

    this.isInitialized = true;
    console.log('[LocationBroadcast] Service initialized for user:', userId);
  }

  /**
   * Cleanup the service
   */
  destroy(): void {
    webSocketService.off('location:update', this.handleLocationUpdate);
    webSocketService.off('location:bulk', this.handleBulkLocation);

    this.stopWatchingLocation();

    this.otherUsersLocations.clear();
    this.locationListeners.clear();
    this.bulkLocationListeners.clear();

    this.isInitialized = false;
    console.log('[LocationBroadcast] Service destroyed');
  }

  // ==================== Location Watching ====================

  /**
   * Start watching user's location
   */
  startWatchingLocation(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.privacySettings.enabled) {
        reject(new Error('Location sharing is disabled'));
        return;
      }

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      if (this.watchId !== null) {
        console.log('[LocationBroadcast] Already watching location');
        resolve();
        return;
      }

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handlePositionUpdate(position);
          resolve();
        },
        (error) => {
          console.error('[LocationBroadcast] Geolocation error:', error);
          reject(error);
        },
        this.GEOLOCATION_OPTIONS
      );

      console.log('[LocationBroadcast] Started watching location');
    });
  }

  /**
   * Stop watching user's location
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('[LocationBroadcast] Stopped watching location');
    }
  }

  /**
   * Handle position update from geolocation API
   */
  private handlePositionUpdate(position: GeolocationPosition): void {
    const now = Date.now();

    // Throttle updates
    if (now - this.lastBroadcastTime < this.THROTTLE_INTERVAL) {
      return;
    }

    // Check if location changed significantly
    if (this.currentLocation) {
      const distance = this.calculateDistance(
        this.currentLocation.latitude,
        this.currentLocation.longitude,
        position.coords.latitude,
        position.coords.longitude
      );

      if (distance < this.MIN_DISTANCE_CHANGE) {
        return; // Not enough change to broadcast
      }
    }

    // Create location update
    const location: LocationUpdate = {
      userId: this.currentUserId!,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
      altitude: position.coords.altitude ?? undefined,
      geohash: this.generateGeohash(position.coords.latitude, position.coords.longitude),
    };

    // Apply privacy precision
    this.applyPrivacyPrecision(location);

    // Store current location
    this.currentLocation = location;
    this.lastBroadcastTime = now;

    // Broadcast to server
    this.broadcastLocation(location);

    console.log('[LocationBroadcast] Location updated:', {
      lat: location.latitude.toFixed(6),
      lng: location.longitude.toFixed(6),
      accuracy: location.accuracy.toFixed(0),
    });
  }

  /**
   * Broadcast location to server
   */
  private broadcastLocation(location: LocationUpdate): void {
    webSocketService.emit('location:broadcast', {
      location,
      privacy: this.privacySettings,
    });
  }

  /**
   * Apply privacy precision to location
   */
  private applyPrivacyPrecision(location: LocationUpdate): void {
    switch (this.privacySettings.precision) {
      case 'exact':
        // No modification
        break;
      case 'approximate':
        // Round to ~100m precision
        location.latitude = Math.round(location.latitude * 1000) / 1000;
        location.longitude = Math.round(location.longitude * 1000) / 1000;
        break;
      case 'city':
        // Round to ~10km precision
        location.latitude = Math.round(location.latitude * 10) / 10;
        location.longitude = Math.round(location.longitude * 10) / 10;
        break;
    }
  }

  // ==================== Privacy Settings ====================

  /**
   * Update privacy settings
   */
  updatePrivacySettings(settings: Partial<LocationPrivacySettings>): void {
    this.privacySettings = { ...this.privacySettings, ...settings };

    // If disabled, stop watching
    if (!this.privacySettings.enabled) {
      this.stopWatchingLocation();
    }

    console.log('[LocationBroadcast] Privacy settings updated:', this.privacySettings);
  }

  /**
   * Get current privacy settings
   */
  getPrivacySettings(): LocationPrivacySettings {
    return { ...this.privacySettings };
  }

  // ==================== Location Queries ====================

  /**
   * Get current user's location
   */
  getCurrentLocation(): LocationUpdate | null {
    return this.currentLocation;
  }

  /**
   * Get location of a specific user
   */
  getUserLocation(userId: string): LocationUpdate | null {
    return this.otherUsersLocations.get(userId) || null;
  }

  /**
   * Get all tracked locations
   */
  getAllLocations(): Record<string, LocationUpdate> {
    const result: Record<string, LocationUpdate> = {};
    this.otherUsersLocations.forEach((location, userId) => {
      // Filter out stale locations
      if (Date.now() - location.timestamp < this.LOCATION_TIMEOUT) {
        result[userId] = location;
      }
    });
    return result;
  }

  /**
   * Request locations for specific users
   */
  requestLocations(userIds: string[]): void {
    webSocketService.emit('location:request', { userIds });
  }

  // ==================== Event Handlers ====================

  /**
   * Handle location update from another user
   */
  private handleLocationUpdate = (data: any) => {
    const location: LocationUpdate = {
      userId: data.userId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      timestamp: data.timestamp,
      heading: data.heading,
      speed: data.speed,
      altitude: data.altitude,
      geohash: data.geohash,
    };

    this.otherUsersLocations.set(location.userId, location);
    this.notifyLocationListeners(location);

    console.log('[LocationBroadcast] Received location update:', location.userId);
  };

  /**
   * Handle bulk location updates
   */
  private handleBulkLocation = (data: any) => {
    const locations: Record<string, LocationUpdate> = {};

    if (Array.isArray(data.locations)) {
      data.locations.forEach((loc: any) => {
        const location: LocationUpdate = {
          userId: loc.userId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          timestamp: loc.timestamp,
          heading: loc.heading,
          speed: loc.speed,
          altitude: loc.altitude,
          geohash: loc.geohash,
        };
        this.otherUsersLocations.set(location.userId, location);
        locations[location.userId] = location;
      });
    }

    this.notifyBulkLocationListeners(locations);
    console.log('[LocationBroadcast] Bulk location update:', Object.keys(locations).length, 'users');
  };

  // ==================== Listeners ====================

  /**
   * Notify location listeners
   */
  private notifyLocationListeners(location: LocationUpdate): void {
    this.locationListeners.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('[LocationBroadcast] Error in location listener:', error);
      }
    });
  }

  /**
   * Notify bulk location listeners
   */
  private notifyBulkLocationListeners(locations: Record<string, LocationUpdate>): void {
    this.bulkLocationListeners.forEach(callback => {
      try {
        callback(locations);
      } catch (error) {
        console.error('[LocationBroadcast] Error in bulk location listener:', error);
      }
    });
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: LocationUpdateCallback): () => void {
    this.locationListeners.add(callback);
    return () => {
      this.locationListeners.delete(callback);
    };
  }

  /**
   * Subscribe to bulk location updates
   */
  onBulkLocationUpdate(callback: BulkLocationCallback): () => void {
    this.bulkLocationListeners.add(callback);
    return () => {
      this.bulkLocationListeners.delete(callback);
    };
  }

  // ==================== Utility Methods ====================

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Generate simple geohash for location (precision 6)
   */
  private generateGeohash(lat: number, lon: number): string {
    // Simplified geohash (in production, use a proper geohash library)
    const precision = 6;
    const latBin = Math.floor((lat + 90) * Math.pow(10, precision));
    const lonBin = Math.floor((lon + 180) * Math.pow(10, precision));
    return `${latBin}-${lonBin}`;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      isWatching: this.watchId !== null,
      currentLocation: this.currentLocation,
      trackedUsers: this.otherUsersLocations.size,
      locationListeners: this.locationListeners.size,
      bulkLocationListeners: this.bulkLocationListeners.size,
      lastBroadcastTime: this.lastBroadcastTime,
      privacyEnabled: this.privacySettings.enabled,
      isInitialized: this.isInitialized,
    };
  }
}

// Create singleton instance
export const locationBroadcastService = new LocationBroadcastService();

export default locationBroadcastService;
