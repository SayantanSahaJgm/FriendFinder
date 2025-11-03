/**
 * BluetoothService.ts
 * 
 * Core Bluetooth Low Energy (BLE) service for FriendFinder nearby user discovery.
 * Handles advertising (broadcasting user presence) and scanning (detecting nearby users).
 * 
 * Platform: React Native (requires react-native-ble-plx)
 * Install: npm install react-native-ble-plx
 */

import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

// FriendFinder BLE Service UUID (custom UUID for the app)
const FRIENDFINDER_SERVICE_UUID = '0000FFF0-0000-1000-8000-00805F9B34FB';
const FRIENDFINDER_CHARACTERISTIC_UUID = '0000FFF1-0000-1000-8000-00805F9B34FB';

// Advertisement data structure
export interface NearbyUser {
  userID: string;
  username: string;
  status: 'online' | 'busy' | 'away';
  timestamp: number;
  rssi: number;
  distance: number;
  lastSeen: number;
}

interface BroadcastPayload {
  uid: string;        // 8-char hashed userID
  un: string;         // 12-char username
  st: string;         // status (2 chars: on/bs/aw)
  ts: number;         // Unix timestamp
}

export class BluetoothService {
  private bleManager: BleManager;
  private isScanning: boolean = false;
  private isAdvertising: boolean = false;
  private nearbyUsers: Map<string, NearbyUser> = new Map();
  private cleanupInterval?: NodeJS.Timeout;
  
  // Callbacks
  private onDeviceFoundCallback?: (user: NearbyUser) => void;
  private onDeviceLostCallback?: (userID: string) => void;
  private onStateChangeCallback?: (state: State) => void;

  constructor() {
    this.bleManager = new BleManager();
    this.setupBleStateListener();
  }

  /**
   * Initialize Bluetooth and request permissions
   */
  async initialize(): Promise<boolean> {
    try {
      // Check BLE state
      const state = await this.bleManager.state();
      console.log('BLE State:', state);

      if (state !== State.PoweredOn) {
        console.warn('Bluetooth is not powered on. Current state:', state);
        return false;
      }

      // Request permissions (Android only)
      if (Platform.OS === 'android') {
        const granted = await this.requestAndroidPermissions();
        if (!granted) {
          console.error('Bluetooth permissions not granted');
          return false;
        }
      }

      console.log('✅ Bluetooth initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
      return false;
    }
  }

  /**
   * Request Android Bluetooth permissions (Android 12+)
   */
  private async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    const apiLevel = Platform.Version;

    try {
      if (apiLevel >= 31) {
        // Android 12+ requires new permissions
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        return Object.values(granted).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
        ]);

        return Object.values(granted).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Listen for Bluetooth state changes
   */
  private setupBleStateListener(): void {
    this.bleManager.onStateChange((state) => {
      console.log('BLE State changed to:', state);
      this.onStateChangeCallback?.(state);

      if (state === State.PoweredOn) {
        console.log('Bluetooth is now powered on');
      } else if (state === State.PoweredOff) {
        console.warn('Bluetooth is powered off. Stopping services.');
        this.stopScanning();
        this.stopAdvertising();
      }
    }, true);
  }

  /**
   * Start advertising (broadcasting) user presence
   * @param userID - Current user's MongoDB ObjectID
   * @param username - Current user's display name
   * @param status - User status (online, busy, away)
   */
  async startAdvertising(
    userID: string,
    username: string,
    status: 'online' | 'busy' | 'away' = 'online'
  ): Promise<void> {
    if (this.isAdvertising) {
      console.log('Already advertising');
      return;
    }

    try {
      const payload = this.createBroadcastPayload(userID, username, status);
      const encodedPayload = this.encodePayload(payload);

      // Note: react-native-ble-plx doesn't support peripheral advertising on most devices.
      // For production, you'll need:
      // 1. Android: Use native module with BluetoothLeAdvertiser
      // 2. iOS: Use native module with CBPeripheralManager
      // 3. Or use a bridge to native code

      console.log('📡 Starting BLE advertising (requires native implementation)');
      console.log('Payload:', payload);
      console.log('Encoded:', encodedPayload);

      this.isAdvertising = true;

      // TODO: Implement native advertising bridge
      // For now, log the payload that would be advertised
      console.warn('⚠️ Advertising requires native bridge implementation');
      console.log('Would advertise:', {
        serviceUUID: FRIENDFINDER_SERVICE_UUID,
        payload: encodedPayload,
      });
    } catch (error) {
      console.error('Error starting advertising:', error);
      throw error;
    }
  }

  /**
   * Stop advertising
   */
  stopAdvertising(): void {
    if (!this.isAdvertising) return;

    console.log('🛑 Stopping BLE advertising');
    this.isAdvertising = false;

    // TODO: Stop native advertising
  }

  /**
   * Start scanning for nearby devices
   */
  async startScanning(): Promise<void> {
    if (this.isScanning) {
      console.log('Already scanning');
      return;
    }

    try {
      console.log('🔍 Starting BLE scan...');

      this.isScanning = true;

      // Start scanning for devices advertising FriendFinder service
      this.bleManager.startDeviceScan(
        [FRIENDFINDER_SERVICE_UUID], // Filter by service UUID
        { allowDuplicates: true }, // Allow duplicate advertisements for RSSI updates
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            return;
          }

          if (device) {
            this.handleDeviceFound(device);
          }
        }
      );

      // Start cleanup interval to remove stale users
      this.startCleanupInterval();

      console.log('✅ BLE scanning started');
    } catch (error) {
      console.error('Error starting scan:', error);
      this.isScanning = false;
      throw error;
    }
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    if (!this.isScanning) return;

    console.log('🛑 Stopping BLE scan');
    this.bleManager.stopDeviceScan();
    this.isScanning = false;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Handle discovered device
   */
  private handleDeviceFound(device: Device): void {
    try {
      // Extract advertisement data
      const manufacturerData = device.manufacturerData;
      if (!manufacturerData) return;

      // Decode payload
      const payload = this.decodePayload(manufacturerData);
      if (!payload) return;

      // Calculate distance from RSSI
      const distance = this.calculateDistance(device.rssi || -100);

      // Create or update nearby user
      const nearbyUser: NearbyUser = {
        userID: payload.uid,
        username: payload.un,
        status: this.decodeStatus(payload.st),
        timestamp: payload.ts,
        rssi: device.rssi || -100,
        distance,
        lastSeen: Date.now(),
      };

      const wasNew = !this.nearbyUsers.has(nearbyUser.userID);
      this.nearbyUsers.set(nearbyUser.userID, nearbyUser);

      if (wasNew) {
        console.log(`✨ New user discovered: ${nearbyUser.username} (${distance.toFixed(1)}m)`);
        this.onDeviceFoundCallback?.(nearbyUser);
      } else {
        // Just update lastSeen and RSSI silently
        this.nearbyUsers.get(nearbyUser.userID)!.lastSeen = Date.now();
        this.nearbyUsers.get(nearbyUser.userID)!.rssi = device.rssi || -100;
        this.nearbyUsers.get(nearbyUser.userID)!.distance = distance;
      }
    } catch (error) {
      console.error('Error handling device:', error);
    }
  }

  /**
   * Start cleanup interval to remove stale users
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 30000; // 30 seconds

      for (const [userID, user] of this.nearbyUsers.entries()) {
        if (now - user.lastSeen > staleThreshold) {
          console.log(`👋 User disappeared: ${user.username}`);
          this.nearbyUsers.delete(userID);
          this.onDeviceLostCallback?.(userID);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Get list of nearby users
   */
  getNearbyUsers(): NearbyUser[] {
    return Array.from(this.nearbyUsers.values());
  }

  /**
   * Create broadcast payload
   */
  private createBroadcastPayload(
    userID: string,
    username: string,
    status: string
  ): BroadcastPayload {
    return {
      uid: this.hashUserID(userID),
      un: username.slice(0, 12), // Limit to 12 chars
      st: this.encodeStatus(status),
      ts: Math.floor(Date.now() / 1000), // Unix timestamp
    };
  }

  /**
   * Hash userID for privacy (simple hash, use crypto in production)
   */
  private hashUserID(userID: string): string {
    // Simple hash - in production use crypto.subtle.digest or similar
    let hash = 0;
    for (let i = 0; i < userID.length; i++) {
      const char = userID.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).slice(0, 8);
  }

  /**
   * Encode status to 2 characters
   */
  private encodeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      online: 'on',
      busy: 'bs',
      away: 'aw',
    };
    return statusMap[status] || 'on';
  }

  /**
   * Decode status from 2 characters
   */
  private decodeStatus(encoded: string): 'online' | 'busy' | 'away' {
    const statusMap: Record<string, 'online' | 'busy' | 'away'> = {
      on: 'online',
      bs: 'busy',
      aw: 'away',
    };
    return statusMap[encoded] || 'online';
  }

  /**
   * Encode payload to base64 string (for manufacturer data)
   */
  private encodePayload(payload: BroadcastPayload): string {
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString('base64');
  }

  /**
   * Decode payload from base64 manufacturer data
   */
  private decodePayload(manufacturerData: string): BroadcastPayload | null {
    try {
      const decoded = Buffer.from(manufacturerData, 'base64').toString('utf-8');
      const payload = JSON.parse(decoded) as BroadcastPayload;

      // Validate payload
      if (!payload.uid || !payload.un || !payload.ts) {
        return null;
      }

      // Check timestamp freshness (ignore if > 60 seconds old)
      const now = Math.floor(Date.now() / 1000);
      if (now - payload.ts > 60) {
        return null;
      }

      return payload;
    } catch (error) {
      // Invalid payload, ignore
      return null;
    }
  }

  /**
   * Calculate distance from RSSI (Received Signal Strength Indicator)
   * @param rssi - Signal strength in dBm
   * @param txPower - Transmission power at 1 meter (default: -59 dBm)
   * @param n - Path loss exponent (2.0 = open space, 3.5 = indoor)
   */
  private calculateDistance(rssi: number, txPower: number = -59, n: number = 2.5): number {
    if (rssi === 0) return -1.0; // Invalid

    const ratio = rssi / txPower;
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      const distance = 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
      return distance;
    }
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceMeters: number): string {
    if (distanceMeters < 0) return 'Unknown';
    if (distanceMeters < 1) return 'Very close';
    if (distanceMeters < 3) return `${distanceMeters.toFixed(1)}m away`;
    if (distanceMeters < 10) return 'Nearby';
    return 'Far';
  }

  /**
   * Register callback for device found events
   */
  onDeviceFound(callback: (user: NearbyUser) => void): void {
    this.onDeviceFoundCallback = callback;
  }

  /**
   * Register callback for device lost events
   */
  onDeviceLost(callback: (userID: string) => void): void {
    this.onDeviceLostCallback = callback;
  }

  /**
   * Register callback for BLE state changes
   */
  onStateChange(callback: (state: State) => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopScanning();
    this.stopAdvertising();
    this.nearbyUsers.clear();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.bleManager.destroy();
    console.log('BluetoothService destroyed');
  }
}

// Singleton instance
let bluetoothServiceInstance: BluetoothService | null = null;

export const getBluetoothService = (): BluetoothService => {
  if (!bluetoothServiceInstance) {
    bluetoothServiceInstance = new BluetoothService();
  }
  return bluetoothServiceInstance;
};

export default BluetoothService;
