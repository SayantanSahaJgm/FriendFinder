export interface WifiUser {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  lastSeenWiFi: Date;
  lastSeen: Date;
  isFriend: boolean;
  hasPendingRequestFrom: boolean;
  hasPendingRequestTo: boolean;
}

export interface WifiStatus {
  hasWiFi: boolean;
  lastSeenWiFi?: Date;
}

export interface NearbyWifiResponse {
  users: WifiUser[];
  count: number;
  networkHash: string;
}

export const wifiService = {
  /**
   * Generate a WiFi pairing code for manual connection
   * @param networkName - Display name for the WiFi network (e.g., "Home WiFi", "Office Network")
   * @returns Pairing code and expiration time
   */
  async generatePairingCode(networkName: string): Promise<{ 
    pairingCode: string; 
    expiresAt: Date;
    message: string;
  }> {
    const response = await fetch("/api/users/wifi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ networkName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate pairing code");
    }

    return response.json();
  },

  /**
   * Pair with another user using their WiFi pairing code
   * @param code - 6-digit pairing code from the other user
   * @returns Success message and friend request details
   */
  async pairWithCode(code: string): Promise<{ 
    success: boolean; 
    message: string;
    recipientUsername?: string;
  }> {
    const response = await fetch("/api/users/wifi/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairingCode: code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to pair with code");
    }

    return response.json();
  },

  async updateWifi(ssid: string): Promise<{ success: boolean; message: string; lastSeenWiFi?: Date }> {
    const response = await fetch("/api/users/wifi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ssid }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update WiFi");
    }

    return response.json();
  },

  async getWifiStatus(): Promise<WifiStatus> {
    const response = await fetch("/api/users/wifi");
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get WiFi status");
    }

    return response.json();
  },

  async getNearbyUsers(): Promise<NearbyWifiResponse> {
    const response = await fetch("/api/users/nearby-wifi");
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get nearby users");
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
