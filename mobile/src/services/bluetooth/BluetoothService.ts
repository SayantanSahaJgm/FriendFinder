/**
 * Copied BluetoothService for React Native mobile scaffold
 */

import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';
import { startAdvertising as nativeStartAdvertising, stopAdvertising as nativeStopAdvertising } from '../../native/BleAdvertiser';
import { isAdvertisingAvailable } from '../../native/BleAdvertiser';

const FRIENDFINDER_SERVICE_UUID = '0000FFF0-0000-1000-8000-00805F9B34FB';

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
  uid: string;
  un: string;
  st: string;
  ts: number;
}

export class BluetoothService {
  private bleManager: BleManager;
  private isScanning: boolean = false;
  private isAdvertising: boolean = false;
  private nearbyUsers: Map<string, NearbyUser> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  private onDeviceFoundCallback?: (user: NearbyUser) => void;
  private onDeviceLostCallback?: (userID: string) => void;
  private onStateChangeCallback?: (state: State) => void;

  constructor() {
    this.bleManager = new BleManager();
    this.setupBleStateListener();
  }

  /**
   * Quick synchronous helper for UI code: is native advertising available on this device?
   */
  isAdvertisingAvailable(): boolean {
    return isAdvertisingAvailable();
  }

  async initialize(): Promise<boolean> {
    try {
      const state = await this.bleManager.state();
      if (state !== State.PoweredOn) return false;

      if (Platform.OS === 'android') {
        const granted = await this.requestAndroidPermissions();
        if (!granted) return false;
      }

      return true;
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
      return false;
    }
  }

  private async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    const apiLevel = Platform.Version as number;
    try {
      if (apiLevel >= 31) {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        return Object.values(granted).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
        ]);
        return Object.values(granted).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  private setupBleStateListener(): void {
    this.bleManager.onStateChange((state) => {
      this.onStateChangeCallback?.(state);
      if (state === State.PoweredOff) {
        this.stopScanning();
        this.stopAdvertising();
      }
    }, true);
  }

  async startAdvertising(userID: string, username: string, status: 'online' | 'busy' | 'away' = 'online') {
    if (this.isAdvertising) return;
    const payload = this.createBroadcastPayload(userID, username, status);
    const encoded = this.encodePayload(payload);
    // Attempt to call native advertising bridge. If bridge is not available, warn and keep advertising flag for internal tracking.
    try {
      const ok = await nativeStartAdvertising(FRIENDFINDER_SERVICE_UUID, encoded);
      if (ok) {
        this.isAdvertising = true;
        console.log('Native advertising started with payload');
      } else {
        this.isAdvertising = false;
        console.warn('Native advertising bridge not available or returned failure. Payload:', encoded);
      }
    } catch (err) {
      this.isAdvertising = false;
      console.warn('Native advertising bridge threw an error. Payload:', encoded, err);
    }
  }

  async stopAdvertising(): Promise<void> {
    if (!this.isAdvertising) return;
    try {
      const ok = await nativeStopAdvertising();
      if (ok) {
        console.log('Native advertising stopped');
      } else {
        console.warn('Native advertising bridge stop failed or not available');
      }
    } catch (err) {
      console.warn('Native advertising bridge stop threw an error', err);
    }

    // Ensure internal state is cleared even if native stop failed to avoid stale state
    this.isAdvertising = false;
  }

  async startScanning(): Promise<void> {
    if (this.isScanning) return;
    this.isScanning = true;
    this.bleManager.startDeviceScan([FRIENDFINDER_SERVICE_UUID], { allowDuplicates: true }, (error, device) => {
      if (error) return;
      if (device) this.handleDeviceFound(device);
    });
    this.startCleanupInterval();
  }

  stopScanning(): void {
    if (!this.isScanning) return;
    this.bleManager.stopDeviceScan();
    this.isScanning = false;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  private handleDeviceFound(device: Device): void {
    try {
      const manufacturerData = device.manufacturerData;
      if (!manufacturerData) return;
      const payload = this.decodePayload(manufacturerData);
      if (!payload) return;
      const distance = this.calculateDistance(device.rssi || -100);
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
      if (wasNew) this.onDeviceFoundCallback?.(nearbyUser);
      else {
        const u = this.nearbyUsers.get(nearbyUser.userID)!;
        u.lastSeen = Date.now();
        u.rssi = nearbyUser.rssi;
        u.distance = nearbyUser.distance;
      }
    } catch (error) {
      console.error('Error handling device:', error);
    }
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 30000;
      for (const [userID, user] of this.nearbyUsers.entries()) {
        if (now - user.lastSeen > staleThreshold) {
          this.nearbyUsers.delete(userID);
          this.onDeviceLostCallback?.(userID);
        }
      }
    }, 5000);
  }

  getNearbyUsers(): NearbyUser[] {
    return Array.from(this.nearbyUsers.values());
  }

  private createBroadcastPayload(userID: string, username: string, status: string): BroadcastPayload {
    return {
      uid: this.hashUserID(userID),
      un: username.slice(0, 12),
      st: this.encodeStatus(status),
      ts: Math.floor(Date.now() / 1000),
    };
  }

  private hashUserID(userID: string): string {
    let hash = 0;
    for (let i = 0; i < userID.length; i++) {
      const char = userID.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 8);
  }

  private encodeStatus(status: string): string {
    const statusMap: Record<string, string> = { online: 'on', busy: 'bs', away: 'aw' };
    return statusMap[status] || 'on';
  }

  private decodeStatus(encoded: string): 'online' | 'busy' | 'away' {
    const statusMap: Record<string, 'online' | 'busy' | 'away'> = { on: 'online', bs: 'busy', aw: 'away' };
    return statusMap[encoded] || 'online';
  }

  private encodePayload(payload: BroadcastPayload): string {
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString('base64');
  }

  private decodePayload(manufacturerData: string): BroadcastPayload | null {
    try {
      const decoded = Buffer.from(manufacturerData, 'base64').toString('utf-8');
      const payload = JSON.parse(decoded) as BroadcastPayload;
      if (!payload.uid || !payload.un || !payload.ts) return null;
      const now = Math.floor(Date.now() / 1000);
      if (now - payload.ts > 60) return null;
      return payload;
    } catch (error) {
      return null;
    }
  }

  private calculateDistance(rssi: number, txPower: number = -59, n: number = 2.5): number {
    if (rssi === 0) return -1.0;
    const ratio = rssi / txPower;
    if (ratio < 1.0) return Math.pow(ratio, 10);
    const distance = 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
    return distance;
  }

  static formatDistance(distanceMeters: number): string {
    if (distanceMeters < 0) return 'Unknown';
    if (distanceMeters < 1) return 'Very close';
    if (distanceMeters < 3) return `${distanceMeters.toFixed(1)}m away`;
    if (distanceMeters < 10) return 'Nearby';
    return 'Far';
  }

  onDeviceFound(callback: (user: NearbyUser) => void): void { this.onDeviceFoundCallback = callback; }
  onDeviceLost(callback: (userID: string) => void): void { this.onDeviceLostCallback = callback; }
  onStateChange(callback: (state: State) => void): void { this.onStateChangeCallback = callback; }

  destroy(): void {
    this.stopScanning();
    this.stopAdvertising();
    this.nearbyUsers.clear();
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.bleManager.destroy();
  }
}

let bluetoothServiceInstance: BluetoothService | null = null;
export const getBluetoothService = (): BluetoothService => {
  if (!bluetoothServiceInstance) bluetoothServiceInstance = new BluetoothService();
  return bluetoothServiceInstance;
};

export default BluetoothService;
