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
    const response = await fetch("/api/users/nearby-bluetooth");
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get nearby users");
    }

    return response.json();
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