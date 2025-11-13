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
   * Get effective connection type from Network Information API
   */
  private getConnectionType(): string | null {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        return connection.effectiveType || connection.type || null;
      }
    }
    return null;
  }

  /**
   * Get local IP address and subnet for network identification
   */
  private async getLocalNetworkInfo(): Promise<{ localIP: string; subnet: string } | null> {
    try {
      // Use WebRTC to get local IP address
      const pc = new RTCPeerConnection({ iceServers: [] });
      const noop = () => {};
      
      pc.createDataChannel('');
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      return new Promise((resolve) => {
        pc.onicecandidate = (ice) => {
          if (!ice || !ice.candidate || !ice.candidate.candidate) {
            resolve(null);
            return;
          }
          
          const candidateStr = ice.candidate.candidate;
          const ipMatch = candidateStr.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
          
          if (ipMatch && ipMatch[0]) {
            const localIP = ipMatch[0];
            // Extract subnet (first 3 octets)
            const subnet = localIP.split('.').slice(0, 3).join('.');
            pc.close();
            resolve({ localIP, subnet });
          }
        };
        
        // Timeout after 2 seconds
        setTimeout(() => {
          pc.close();
          resolve(null);
        }, 2000);
      });
    } catch (error) {
      console.error('[WiFi] Error getting local network info:', error);
      return null;
    }
  }

  /**
   * Automatically detect WiFi network
   * Uses multiple methods: Network API, local IP subnet detection
   */
  private async detectNetwork(): Promise<{ networkName: string; networkBSSID: string } | null> {
    try {
      // Method 1: Try to get local network info via WebRTC
      const networkInfo = await this.getLocalNetworkInfo();
      
      if (networkInfo) {
        const { localIP, subnet } = networkInfo;
        console.log('[WiFi] Detected local network:', { localIP, subnet });
        
        // Use subnet as network identifier - all devices on same local network will have same subnet
        const networkName = `WiFi-${subnet}`;
        const networkBSSID = this.generatePseudoBSSID(subnet);
        
        return { networkName, networkBSSID };
      }

      // Method 2: Connection type from Network Information API (less precise)
      const connectionType = this.getConnectionType();
      if (connectionType && connectionType !== 'none') {
        console.log('[WiFi] Detected connection type:', connectionType);
        
        // Use a fallback identifier
        const timestamp = Math.floor(Date.now() / (1000 * 60 * 10)); // Changes every 10 minutes
        const networkName = `Network-${connectionType}`;
        const networkBSSID = this.generatePseudoBSSID(`${connectionType}-${timestamp}`);
        
        return { networkName, networkBSSID };
      }

      return null;
    } catch (error) {
      console.error('[WiFi] Network detection error:', error);
      return null;
    }
  }

  /**
   * Simplified registration using automatic network detection
   * Automatically detects the user's WiFi network without asking for input
   * 
   * Also acts as a heartbeat - call every 30-60 seconds to stay discoverable
   */
  async registerCurrentNetwork(): Promise<{ success: boolean; message: string }> {
    try {
      // Try automatic detection first
      const detectedNetwork = await this.detectNetwork();
      
      if (detectedNetwork) {
        console.log('[WiFi] Auto-detected network:', detectedNetwork.networkName);
        return await this.registerNetwork(detectedNetwork.networkName, detectedNetwork.networkBSSID);
      }

      // If auto-detection fails, fall back to stored network or prompt user
      let networkName = localStorage.getItem('wifiNetworkName');
      
      if (!networkName) {
        // Last resort: prompt user
        networkName = window.prompt(
          'Unable to detect your WiFi network automatically.\n\n' +
          'Please enter your WiFi network name (SSID) manually:',
          ''
        );
        
        if (!networkName || networkName.trim() === '') {
          throw new Error('WiFi network name is required for discovery');
        }
        
        networkName = networkName.trim();
        localStorage.setItem('wifiNetworkName', networkName);
      }
      
      // Create identifier from manual network name
      const networkBSSID = this.generatePseudoBSSID(networkName);
      console.log('[WiFi] Using manual network name:', networkName);
      
      return await this.registerNetwork(networkName, networkBSSID);
    } catch (error) {
      console.error('[WiFi] Error registering network:', error);
      throw error;
    }
  }

  /**
   * Clear stored network name and unregister
   */
  async clearStoredNetwork(): Promise<void> {
    localStorage.removeItem('wifiNetworkName');
    await this.unregister();
  }

  /**
   * Change WiFi network (prompts user for new network name)
   */
  async changeNetwork(): Promise<{ success: boolean; message: string }> {
    localStorage.removeItem('wifiNetworkName');
    return this.registerCurrentNetwork();
  }

  /**
   * Get currently stored network name
   */
  getStoredNetworkName(): string | null {
    return localStorage.getItem('wifiNetworkName');
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

      // Clear stored network name
      localStorage.removeItem('wifiNetworkName');
      
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
