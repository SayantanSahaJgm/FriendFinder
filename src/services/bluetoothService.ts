export interface BluetoothUser {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  lastSeenBluetooth: Date;
  lastSeen: Date;
  isFriend: boolean;
  hasPendingRequestFrom: boolean;
  hasPendingRequestTo: boolean;
}

export interface BluetoothStatus {
  hasBluetooth: boolean;
  lastSeenBluetooth?: Date;
}

export interface NearbyBluetoothResponse {
  users: BluetoothUser[];
  count: number;
  deviceId: string;
}

export const bluetoothService = {
  async updateBluetooth(bluetoothId: string): Promise<{ success: boolean; message: string; lastSeenBluetooth?: Date }> {
    const response = await fetch("/api/users/bluetooth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bluetoothId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update Bluetooth");
    }

    return response.json();
  },

  async clearBluetooth(): Promise<{ success: boolean; message: string }> {
    const response = await fetch("/api/users/bluetooth", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to clear Bluetooth");
    }

    return response.json();
  },

  async getBluetoothStatus(): Promise<BluetoothStatus> {
    const response = await fetch("/api/users/bluetooth");
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get Bluetooth status");
    }

    return response.json();
  },

  /**
   * Send heartbeat to keep Bluetooth presence active
   * Call this every 30-60 seconds while scanning is active
   */
  async sendHeartbeat(): Promise<{ success: boolean; message: string; updatedAt?: Date }> {
    const response = await fetch("/api/bluetooth/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send heartbeat");
    }

    return response.json();
  },

  /**
   * Get nearby users with Bluetooth enabled
   * 
   * WEB VERSION (current): Uses database-based discovery - finds users who recently updated their Bluetooth presence
   * MOBILE APP VERSION (future): Replace this with native Bluetooth scanning:
   *   - iOS: CoreBluetooth framework to scan for BLE devices
   *   - Android: BluetoothAdapter and BluetoothLeScanner APIs
   *   - React Native: libraries like react-native-ble-manager or react-native-ble-plx
   * 
   * The server endpoint should remain the same - just change the client-side data source
   * from database query to actual Bluetooth device scanning results.
   */
  async getNearbyUsers(): Promise<NearbyBluetoothResponse> {
    // Try the Bluetooth-specific endpoint first. Some server implementations
    // require the current user to have a bluetoothId registered and may
    // respond with 400 when it's missing. In that case, fall back to the
    // generic nearby users endpoint so the client can still show results.
    try {
      const response = await fetch("/api/users/nearby-bluetooth");

      if (response.ok) {
        return response.json();
      }

      // If server explicitly says no device is set, try the generic nearby
      // users API as a fallback so the client can still surface nearby users.
      const error = await response.json().catch(() => ({ error: 'Unknown' }));
      if (response.status === 400 && typeof error.error === 'string' && error.error.includes('No Bluetooth device')) {
        console.warn('[WiFi/Bluetooth] Bluetooth endpoint returned 400 - falling back to generic nearby endpoint');
        const fallback = await fetch('/api/users/nearby');
        if (!fallback.ok) {
          const fErr = await fallback.json().catch(() => ({}));
          throw new Error(fErr.error || 'Failed to get nearby users (fallback)');
        }
        // Normalize to NearbyBluetoothResponse shape when possible
        const data = await fallback.json();
        return {
          users: data.users || data.nearby || [],
          count: data.count || (data.users || []).length,
          deviceId: data.deviceId || ''
        } as NearbyBluetoothResponse;
      }

      throw new Error(error.error || 'Failed to get nearby users');
    } catch (err) {
      // If fetch itself failed, surface a helpful message
      throw err instanceof Error ? err : new Error(String(err));
    }
  },

  async generatePairingCode(deviceName: string): Promise<{ success: boolean; bluetoothId?: string; pairingCode?: string; pairingCodeExpires?: string; message?: string }> {
    const response = await fetch('/api/users/bluetooth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate pairing code');
    }

    return response.json();
  },

  async pairWithCode(code: string): Promise<{ success: boolean; message?: string; requestId?: string }> {
    const response = await fetch('/api/users/bluetooth/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to pair with code');
    }

    return response.json();
  },

  async sendFriendRequest(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send friend request");
    }

    return response.json();
  }
};