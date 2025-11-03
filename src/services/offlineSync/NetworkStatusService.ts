/**
 * Network Status Service
 * Monitors online/offline state and provides network quality information
 */

type NetworkStatus = {
  isOnline: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData?: boolean;
};

type NetworkListener = (status: NetworkStatus) => void;

class NetworkStatusService {
  private listeners: Set<NetworkListener> = new Set();
  private currentStatus: NetworkStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeListeners();
      this.updateNetworkInfo();
    }
  }

  /**
   * Initialize browser event listeners
   */
  private initializeListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen to connection changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', this.handleConnectionChange);
      }
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('[Network] Connection restored');
    this.currentStatus.isOnline = true;
    this.updateNetworkInfo();
    this.notifyListeners();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('[Network] Connection lost');
    this.currentStatus.isOnline = false;
    this.notifyListeners();
  };

  /**
   * Handle connection change (Network Information API)
   */
  private handleConnectionChange = (): void => {
    this.updateNetworkInfo();
    this.notifyListeners();
  };

  /**
   * Update network information from Network Information API
   */
  private updateNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.currentStatus.effectiveType = connection.effectiveType;
        this.currentStatus.downlink = connection.downlink;
        this.currentStatus.rtt = connection.rtt;
        this.currentStatus.saveData = connection.saveData;
      }
    }
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Check if network quality is good (4g or better)
   */
  isHighQuality(): boolean {
    if (!this.currentStatus.isOnline) {
      return false;
    }

    const effectiveType = this.currentStatus.effectiveType;
    return !effectiveType || effectiveType === '4g';
  }

  /**
   * Check if in data saver mode
   */
  isDataSaverMode(): boolean {
    return this.currentStatus.saveData === true;
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current status
    listener(this.getStatus());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('[Network] Error in listener:', error);
      }
    });
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', this.handleConnectionChange);
        }
      }
    }

    this.listeners.clear();
  }
}

// Export singleton instance
export const networkStatusService = new NetworkStatusService();
export default networkStatusService;
export type { NetworkStatus, NetworkListener };
