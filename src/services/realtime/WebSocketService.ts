/**
 * WebSocket Service
 * Manages Socket.IO connections with auto-reconnect and event handling
 */

import { io, Socket } from 'socket.io-client';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

type EventCallback = (...args: any[]) => void;
type StatusChangeCallback = (status: ConnectionStatus) => void;

/**
 * WebSocket Service for real-time communication
 */
class WebSocketService {
  private socket: Socket | null = null;
  private config: Required<WebSocketConfig>;
  private status: ConnectionStatus = 'disconnected';
  private statusListeners: Set<StatusChangeCallback> = new Set();
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastPongTime: number = Date.now();
  private isManualDisconnect = false;

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
      autoConnect: config.autoConnect ?? true,
      reconnectionAttempts: config.reconnectionAttempts ?? 10,
      reconnectionDelay: config.reconnectionDelay ?? 1000,
      reconnectionDelayMax: config.reconnectionDelayMax ?? 30000,
      timeout: config.timeout ?? 20000,
    };

    if (typeof window !== 'undefined' && this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (this.status === 'connecting') {
      console.log('[WebSocket] Connection in progress');
      return;
    }

    this.isManualDisconnect = false;
    this.updateStatus('connecting');

    console.log('[WebSocket] Connecting to:', this.config.url);
    console.log('[WebSocket] Options: polling-first, path=/socket.io/, withCredentials=true');

    // Use polling-first handshake to improve reliability behind proxies/load-balancers
    // and include explicit path and credentials so cookies/auth are forwarded when needed.
    this.socket = io(this.config.url, {
      reconnection: false, // We'll handle reconnection manually
      timeout: Math.max(this.config.timeout, 15000),
      transports: ['polling', 'websocket'], // Prefer polling first, then upgrade to websocket
      path: '/socket.io/',
      withCredentials: true,
    });

    this.setupEventListeners();
    this.startHeartbeat();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }

    this.updateStatus('disconnected');
    this.reconnectAttempt = 0;
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.reconnectAttempt = 0;
      this.updateStatus('connected');
      this.lastPongTime = Date.now();
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.updateStatus('error');
      this.attemptReconnect();
    });

    // Disconnected
    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.updateStatus('disconnected');

      // Don't reconnect if it was manual or server-initiated
      if (!this.isManualDisconnect && reason !== 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    // Heartbeat response
    this.socket.on('pong', () => {
      this.lastPongTime = Date.now();
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      this.updateStatus('error');
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.isManualDisconnect || this.reconnectAttempt >= this.config.reconnectionAttempts) {
      console.log('[WebSocket] Max reconnection attempts reached');
      this.updateStatus('error');
      return;
    }

    this.clearReconnectTimer();

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.reconnectionDelay * Math.pow(2, this.reconnectAttempt),
      this.config.reconnectionDelayMax
    );

    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    const finalDelay = delay + jitter;

    this.reconnectAttempt++;

    console.log(
      `[WebSocket] Reconnecting in ${Math.round(finalDelay)}ms (attempt ${this.reconnectAttempt}/${this.config.reconnectionAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      console.log('[WebSocket] Attempting reconnection...');
      this.disconnect();
      this.connect();
    }, finalDelay);
  }

  /**
   * Start heartbeat to detect connection issues
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (!this.socket?.connected) return;

      const timeSinceLastPong = Date.now() - this.lastPongTime;

      // If no pong received in 30 seconds, consider connection dead
      if (timeSinceLastPong > 30000) {
        console.warn('[WebSocket] No pong received, connection appears dead');
        this.socket.disconnect();
        this.attemptReconnect();
        return;
      }

      // Send ping
      this.socket.emit('ping');
    }, 10000); // Ping every 10 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Update connection status and notify listeners
   */
  private updateStatus(newStatus: ConnectionStatus): void {
    if (this.status === newStatus) return;

    this.status = newStatus;
    console.log('[WebSocket] Status changed:', newStatus);

    this.statusListeners.forEach(callback => {
      try {
        callback(newStatus);
      } catch (error) {
        console.error('[WebSocket] Error in status listener:', error);
      }
    });
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusListeners.add(callback);

    // Immediately call with current status
    callback(this.status);

    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, ...args: any[]): boolean {
    if (!this.socket?.connected) {
      console.warn(`[WebSocket] Cannot emit "${event}" - not connected`);
      return false;
    }

    try {
      this.socket.emit(event, ...args);
      return true;
    } catch (error) {
      console.error(`[WebSocket] Error emitting "${event}":`, error);
      return false;
    }
  }

  /**
   * Listen for an event from the server
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.socket) {
      console.warn(`[WebSocket] Cannot listen to "${event}" - socket not initialized`);
      return () => {};
    }

    this.socket.on(event, callback);

    // Return unsubscribe function
    return () => {
      this.socket?.off(event, callback);
    };
  }

  /**
   * Listen for an event once
   */
  once(event: string, callback: EventCallback): () => void {
    if (!this.socket) {
      console.warn(`[WebSocket] Cannot listen to "${event}" - socket not initialized`);
      return () => {};
    }

    this.socket.once(event, callback);

    // Return unsubscribe function
    return () => {
      this.socket?.off(event, callback);
    };
  }

  /**
   * Remove all listeners for an event
   */
  off(event: string, callback?: EventCallback): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Get the underlying Socket.IO instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      status: this.status,
      connected: this.isConnected(),
      reconnectAttempt: this.reconnectAttempt,
      maxReconnectAttempts: this.config.reconnectionAttempts,
      lastPongTime: this.lastPongTime,
      timeSinceLastPong: Date.now() - this.lastPongTime,
      url: this.config.url,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.statusListeners.clear();
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

export default webSocketService;
