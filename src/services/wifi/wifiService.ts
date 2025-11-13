/**
 * WiFi Discovery Service
 * Client-side service for WiFi-based user discovery
 */

export interface WiFiNetwork {
  ssid: string;
  bssid: string;
  signal?: number;
}

export interface NearbyWiFiUser {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  profilePicture?: string;
  network: string;
  lastSeenWiFi: string;
  lastSeenAgo: string;
  isFriend: boolean;
  hasPendingRequestTo: boolean;
  hasPendingRequestFrom: boolean;
  interests?: string[];
}

export interface WiFiStatus {
  isRegistered: boolean;
  isActive: boolean;
  isDiscoveryEnabled: boolean;
  networkName?: string;
  lastSeenWiFi?: string;
}

class WiFiService {
  /**
   * Get browser's WiFi network information (limited in browsers)
   * Note: Browsers cannot directly access WiFi network info for security reasons
   * This is a placeholder that would work with a native bridge or extension
   */
  async getCurrentNetwork(): Promise<WiFiNetwork | null> {
    try {
      // In a real implementation, this would:
      // 1. Use a browser extension with permissions
      // 2. Use a native app bridge (Electron, Capacitor, React Native)
      // 3. Ask user to manually enter network name
      
      // For web browsers, we'll use a simpler approach:
      // Prompt user or use network detection API if available
      
      // Check if running in Electron or similar
      if (typeof window !== 'undefined' && (window as any).electron) {
        const network = await (window as any).electron.getWiFiNetwork();
        return network;
      }

      // For now, return null and let the user manually scan
      console.log('[WiFi] Browser cannot directly access WiFi info');
      return null;
    } catch (error) {
      console.error('[WiFi] Error getting network:', error);
      return null;
    }
  }

  /**
   * Register current WiFi network for discovery
   * @param networkSSID - Network name (SSID)
   * @param networkBSSID - Router MAC address (will be hashed server-side)
   */
  async registerNetwork(networkSSID: string, networkBSSID: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/wifi/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          networkSSID,
          networkBSSID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register network');
      }

      console.log('[WiFi] Network registered:', networkSSID);
      return { success: true, message: data.message };
    } catch (error) {
      console.error('[WiFi] Error registering network:', error);
      throw error;
    }
  }

  /**
   * Simplified registration using a connection test
   * This pings the server which will extract network info server-side (if possible)
   * For web apps, users will need to manually trigger or we use IP-based detection
   * 
   * Also acts as a heartbeat - call every 30-60 seconds to stay discoverable
   */
  async registerCurrentNetwork(): Promise<{ success: boolean; message: string }> {
    try {
      // For web browsers, we can use a simpler approach:
      // 1. Use IP address to approximate network
      // 2. Ask user to manually enter network name
      // 3. Use server-side detection if deployed on same network
      
      // Get public IP as a fallback identifier
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();
      
      // Use IP as network identifier (less precise than BSSID but works in browsers)
      const networkBSSID = `ip-${ip}`;
      const networkSSID = `Network-${ip.split('.')[0]}`; // Simplified name
      
      return await this.registerNetwork(networkSSID, networkBSSID);
    } catch (error) {
      console.error('[WiFi] Error auto-registering network:', error);
      throw error;
    }
  }

  /**
   * Send heartbeat to keep WiFi presence active
   * This is an alias for registerCurrentNetwork since it updates lastSeenWiFi
   * Call this every 30-60 seconds while scanning is active
   */
  async sendHeartbeat(): Promise<{ success: boolean; message: string }> {
    return this.registerCurrentNetwork();
  }

  /**
   * Unregister from WiFi discovery
   */
  async unregister(): Promise<void> {
    try {
      const response = await fetch('/api/wifi/register', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unregister');
      }

      console.log('[WiFi] Unregistered from WiFi discovery');
    } catch (error) {
      console.error('[WiFi] Error unregistering:', error);
      throw error;
    }
  }

  /**
   * Get nearby users on the same WiFi network
   */
  async getNearbyUsers(): Promise<NearbyWiFiUser[]> {
    try {
      const response = await fetch('/api/wifi/nearby');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get nearby users');
      }

      const data = await response.json();
      console.log('[WiFi] Found nearby users:', data.users.length);
      return data.users;
    } catch (error) {
      console.error('[WiFi] Error getting nearby users:', error);
      throw error;
    }
  }

  /**
   * Get current WiFi registration status
   */
  async getStatus(): Promise<WiFiStatus> {
    try {
      const response = await fetch('/api/wifi/status');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get status');
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('[WiFi] Error getting status:', error);
      throw error;
    }
  }

  /**
   * Send friend request to a nearby user
   * (Reuses existing friend request API)
   */
  async sendFriendRequest(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/friends/requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId: userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send friend request');
      }

      console.log('[WiFi] Friend request sent to user:', userId);
    } catch (error) {
      console.error('[WiFi] Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Helper: Generate a pseudo-BSSID from network name
   * For testing purposes when real BSSID isn't available
   */
  generatePseudoBSSID(networkName: string): string {
    // Create a consistent hash-like string from network name
    let hash = 0;
    for (let i = 0; i < networkName.length; i++) {
      hash = ((hash << 5) - hash) + networkName.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Format as MAC address-like string
    const hex = Math.abs(hash).toString(16).padStart(12, '0');
    return hex.match(/.{2}/g)?.join(':') || '00:00:00:00:00:00';
  }
}

// Export singleton instance
export const wifiService = new WiFiService();
export default wifiService;
