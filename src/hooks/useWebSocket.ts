/**
 * useWebSocket Hook
 * React hook for WebSocket connection management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketService, type ConnectionStatus } from '@/services/realtime/WebSocketService';

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, ...args: any[]) => boolean;
  on: (event: string, callback: (...args: any[]) => void) => () => void;
  once: (event: string, callback: (...args: any[]) => void) => () => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  stats: {
    reconnectAttempt: number;
    maxReconnectAttempts: number;
    timeSinceLastPong: number;
  };
}

/**
 * Hook to use WebSocket connection in React components
 */
export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>(webSocketService.getStatus());
  const [stats, setStats] = useState(webSocketService.getStats());
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = webSocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  // Update stats periodically
  useEffect(() => {
    statsIntervalRef.current = setInterval(() => {
      setStats(webSocketService.getStats());
    }, 5000); // Update every 5 seconds

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  // Connect
  const connect = useCallback(() => {
    webSocketService.connect();
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Emit event
  const emit = useCallback((event: string, ...args: any[]) => {
    return webSocketService.emit(event, ...args);
  }, []);

  // Listen to event
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    return webSocketService.on(event, callback);
  }, []);

  // Listen to event once
  const once = useCallback((event: string, callback: (...args: any[]) => void) => {
    return webSocketService.once(event, callback);
  }, []);

  // Remove event listener
  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    webSocketService.off(event, callback);
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    emit,
    on,
    once,
    off,
    stats: {
      reconnectAttempt: stats.reconnectAttempt,
      maxReconnectAttempts: stats.maxReconnectAttempts,
      timeSinceLastPong: stats.timeSinceLastPong,
    },
  };
}

/**
 * Hook to listen for specific WebSocket events
 */
export function useWebSocketEvent<T = any>(
  event: string,
  callback: (data: T) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = webSocketService.on(event, callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}

/**
 * Hook to emit WebSocket events
 */
export function useWebSocketEmit() {
  return useCallback((event: string, ...args: any[]) => {
    return webSocketService.emit(event, ...args);
  }, []);
}

export default useWebSocket;
