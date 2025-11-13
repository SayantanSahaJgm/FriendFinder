'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import io from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'fallback'
  transport: 'websocket' | 'polling' | 'http'
  retryCount: number
  errorCount: number
  lastConnected?: Date
  fallbackActive: boolean
}

interface SocketError {
  type: 'connection' | 'transport' | 'server' | 'timeout' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  message: string
  timestamp: Date
}

export function useSocket() {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<any>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    transport: 'websocket',
    retryCount: 0,
    errorCount: 0,
    fallbackActive: false
  })
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionAttemptRef = useRef<number>(0)
  const lastConnectionAttemptRef = useRef<number>(0)
  const maxRetries = 5
  const baseDelay = 2000 // Increased from 1000ms to 2000ms
  const maxDelay = 60000 // Maximum 60 seconds between retries

  const isConnected = connectionState.status === 'connected'

  // Socket URL configuration
  // In production, use the same domain as the app (no separate socket server needed)
  // In development, use localhost:3004
  const socketUrl = typeof window !== 'undefined' 
    ? (process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3004')
    : 'http://localhost:3004'

  // Initialize Socket.IO connection
  const connect = useCallback(async () => {
    // Prevent rapid reconnection attempts
    const now = Date.now()
    const timeSinceLastAttempt = now - lastConnectionAttemptRef.current
    if (timeSinceLastAttempt < 5000) { // Minimum 5 seconds between attempts
      console.log('Skipping connection attempt - too soon since last attempt')
      return
    }
    
    // Allow connection for both authenticated users and guests
    // Guest users can still use random chat features
    if (status === 'loading') {
      console.log('Session still loading, waiting...')
      return
    }

    if (connectionState.status === 'connecting' || connectionState.status === 'connected') {
      return
    }

    lastConnectionAttemptRef.current = now
    connectionAttemptRef.current++

    console.log('Connecting to Socket.IO server:', socketUrl)
    setConnectionState(prev => ({ ...prev, status: 'connecting' }))
    setConnectionError(null)

    // Check if Socket.IO server is available first
    try {
      const healthCheck = await fetch('/api/socket-health');
      if (!healthCheck.ok) {
        console.warn('Socket.IO server health check failed, attempting direct connection anyway');
      }
    } catch (error) {
      console.warn('Socket.IO health check error:', error);
    }

    try {
      const newSocket = io(socketUrl, {
        // Server.js exposes the Socket.IO endpoint at /socket.io/
        path: '/socket.io/',
        // Allow both transports; Socket.IO will upgrade from polling to WebSocket
        transports: ['polling', 'websocket'],
        upgrade: true,
        timeout: 20000,
        reconnection: false, // We handle reconnection manually
        autoConnect: true,
        forceNew: true,
        // Send credentials so the server can accept authenticated connections
        withCredentials: true,
      })

      // Connection successful
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        setConnectionState(prev => ({
          ...prev,
          status: 'connected',
          transport: (newSocket as any).io?.engine?.transport?.name || 'websocket',
          lastConnected: new Date(),
          retryCount: 0,
          errorCount: 0
        }))
        setConnectionError(null)
        
        // Register user with the socket (authenticated or guest)
        if (session?.user) {
          newSocket.emit('user-register', {
            userId: session.user.id || session.user.email,
            username: session.user.name || session.user.email?.split('@')[0],
            email: session.user.email
          })
        } else {
          // Register as guest for random chat
          const guestId = localStorage.getItem('guestUserId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('guestUserId', guestId)
          newSocket.emit('user-register', {
            userId: guestId,
            username: localStorage.getItem('guestUsername') || 'Guest',
            isGuest: true
          })
        }

        // Start health check
        startHealthCheck()
        
        toast.success('Connected to real-time services')
      })

      // Connection error
      newSocket.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error)
        // Increment error count and attempt reconnects, but don't immediately surface
        // a destructive connectionError to the UI — we only show an error after
        // sustained failures (handled by scheduleReconnect when maxRetries reached).
        setConnectionState(prev => ({
          ...prev,
          status: 'failed',
          errorCount: prev.errorCount + 1
        }))

        // If it's a server unavailable error, activate fallback mode immediately
        if (error.message?.includes('timeout') || error.message?.includes('503')) {
          setConnectionState(prev => ({ ...prev, status: 'fallback', fallbackActive: true }))
          console.log('Activating fallback mode due to server unavailability')
          toast.info('Real-time features temporarily unavailable, using polling mode')
        }

        // Schedule reconnect with exponential backoff; scheduleReconnect will set
        // the user-visible connectionError if max retries are reached.
        scheduleReconnect()
      })

      // Disconnection
      newSocket.on('disconnect', (reason: any) => {
        console.log('Socket disconnected:', reason)
        setConnectionState(prev => ({ ...prev, status: 'disconnected' }))
        stopHealthCheck()
        
        // Auto-reconnect on unexpected disconnection
        if (reason === 'io server disconnect' || reason === 'transport close') {
          scheduleReconnect()
        }
      })

      // Socket errors
      newSocket.on('error', (error: any) => {
        console.error('Socket error:', error)
        setConnectionError(error.message || 'Socket error')
      })

      // Registration success
      newSocket.on('connection-confirmed', (data: any) => {
        console.log('User registered successfully:', data)
      })

      // Registration error
      newSocket.on('error', (data: any) => {
        console.error('Socket error:', data)
        setConnectionError(data.message || data || 'Socket error')
      })

      setSocket(newSocket)

    } catch (error) {
      console.error('Failed to create socket connection:', error)
      setConnectionState(prev => ({
        ...prev,
        status: 'failed',
        errorCount: prev.errorCount + 1
      }))
      setConnectionError(error instanceof Error ? error.message : 'Connection failed')
      scheduleReconnect()
    }
  }, [session, status, socketUrl, connectionState.status])

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket) {
      console.log('Disconnecting socket...')
      socket.disconnect()
      setSocket(null)
      setConnectionState(prev => ({ ...prev, status: 'disconnected' }))
      stopHealthCheck()
      clearReconnectTimeout()
    }
  }, [socket])

  // Reconnect with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (connectionState.retryCount >= maxRetries) {
      console.log('Max reconnection attempts reached')
      // Surface a user-friendly connection error only after we've exhausted retries
      setConnectionError('Max reconnection attempts reached. Please refresh the page.')
      connectionAttemptRef.current = 0 // Reset for manual retry
      return
    }

    // Exponential backoff with jitter
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, connectionState.retryCount), maxDelay)
    const jitter = Math.random() * 1000 // Add up to 1 second of random jitter
    const delay = exponentialDelay + jitter
    
    console.log(`Scheduling reconnect in ${Math.round(delay)}ms (attempt ${connectionState.retryCount + 1}/${maxRetries})`)
    
    clearReconnectTimeout()
    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionState(prev => ({
        ...prev,
        status: 'reconnecting',
        retryCount: prev.retryCount + 1
      }))
      disconnect()
      connect()
    }, delay)
  }, [connectionState.retryCount, connect, disconnect])

  // Manual reconnect
  const reconnect = useCallback(() => {
    console.log('Manual reconnect requested')
    setConnectionState(prev => ({ ...prev, retryCount: 0, errorCount: 0 }))
    setConnectionError(null)
    connectionAttemptRef.current = 0
    lastConnectionAttemptRef.current = 0
    disconnect()
    connect()
  }, [connect, disconnect])

  // Clear reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Health check
  const startHealthCheck = useCallback(() => {
    stopHealthCheck()

    // Determine a production-friendly health URL:
    // 1. NEXT_PUBLIC_SOCKET_HEALTH_URL (explicit)
    // 2. derive from socketUrl (e.g. https://host -> https://host/health)
    // 3. fallback to localhost health endpoint (dev)
    const explicitHealth = process.env.NEXT_PUBLIC_SOCKET_HEALTH_URL
    let healthUrl = ''
    if (explicitHealth) {
      healthUrl = explicitHealth
    } else {
      try {
        const u = new URL(socketUrl)
        healthUrl = `${u.origin.replace(/\/$/, '')}/health`
      } catch (e) {
        // Fallback for development
        const defaultSocketPort = process.env.NEXT_PUBLIC_SOCKET_PORT || '3004'
        const healthPort = parseInt(defaultSocketPort) + 1
        healthUrl = `http://localhost:${healthPort}/health`
      }
    }

    healthCheckIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(healthUrl)
        if (!response.ok) {
          console.warn('Socket server health check failed', healthUrl)
        }
      } catch (error) {
        // Silently handle health check errors to avoid console spam
      }
    }, 60000) // Check every 60 seconds (increased from 30)
  }, [socketUrl])

  const stopHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current)
      healthCheckIntervalRef.current = null
    }
  }, [])

  // Get health status
  const getHealthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/socket-health')
      if (response.ok) {
        const serverHealth = await response.json()
        return {
          client: {
            connected: isConnected,
            state: connectionState,
            errorSummary: connectionError ? { error: connectionError } : null,
            queueStatus: null
          },
          server: serverHealth
        }
      }
    } catch (error) {
      console.error('Health status check failed:', error)
    }
    
    return {
      client: {
        connected: isConnected,
        state: connectionState,
        errorSummary: connectionError ? { error: connectionError } : null,
        queueStatus: null
      },
      server: {
        status: 'unavailable',
        error: 'Health check failed'
      }
    }
  }, [isConnected, connectionState, connectionError])

  // Effect to handle connection/disconnection based on session
  useEffect(() => {
    // Allow connection for both authenticated and guest users
    if (status === 'authenticated' || status === 'unauthenticated') {
      connect()
    }

    // Only cleanup on unmount, not on dependency changes
    return () => {
      if (status === 'unauthenticated') {
        disconnect()
        clearReconnectTimeout()
        stopHealthCheck()
      }
    }
  }, [session?.user?.email, status]) // Removed connect, disconnect from dependencies

  // HTTP Fallback functions
  const sendMessageFallback = useCallback(async (data: any) => {
    try {
      const response = await fetch('/api/messages/poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Message sent via HTTP fallback:', result);
        return result;
      }
    } catch (error) {
      console.error('HTTP fallback send message failed:', error);
    }
  }, []);

  const getPresenceFallback = useCallback(async (userIds: string[]) => {
    try {
      const response = await fetch(`/api/presence/status?userIds=${userIds.join(',')}`);
      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error('HTTP fallback presence check failed:', error);
    }
  }, []);

  const pollMessagesFallback = useCallback(async (chatId: string, lastMessageId?: string) => {
    try {
      const params = new URLSearchParams({ chatId });
      if (lastMessageId) params.append('lastMessageId', lastMessageId);
      
      const response = await fetch(`/api/messages/poll?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error('HTTP fallback message polling failed:', error);
    }
  }, []);
  const sendFriendRequestNotification = useCallback((data: any) => {
    if (socket && isConnected) {
      socket.emit('friend_request_sent', data)
    }
  }, [socket, isConnected])

  const sendFriendResponseNotification = useCallback((data: any) => {
    if (socket && isConnected) {
      socket.emit('friend_response_sent', data)
    }
  }, [socket, isConnected])

  // Socket event helpers (with fallback)
  const sendMessage = useCallback((data: any) => {
    if (socket && isConnected) {
      socket.emit('message_sent', data)
    } else if (connectionState.fallbackActive) {
      // Use HTTP fallback
      sendMessageFallback(data)
    }
  }, [socket, isConnected, connectionState.fallbackActive, sendMessageFallback])

  const startTyping = useCallback((data: any) => {
    if (socket && isConnected) {
      socket.emit('typing_start', data)
    }
  }, [socket, isConnected])

  const stopTyping = useCallback((data: any) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', data)
    }
  }, [socket, isConnected])

  // Event listeners
  const onFriendRequestReceived = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('friend_request_received', callback)
      return () => socket.off('friend_request_received', callback)
    }
    return () => {}
  }, [socket])

  const onFriendRequestResponse = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('friend_request_response', callback)
      return () => socket.off('friend_request_response', callback)
    }
    return () => {}
  }, [socket])

  const onMessageReceived = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('message_received', callback)
      return () => socket.off('message_received', callback)
    }
    return () => {}
  }, [socket])

  const onUserStatusChanged = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user_status_changed', callback)
      return () => socket.off('user_status_changed', callback)
    }
    return () => {}
  }, [socket])

  const onNearbyBluetoothUpdate = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('bluetooth_update', callback)
      return () => socket.off('bluetooth_update', callback)
    }
    return () => {}
  }, [socket])

  const onNearbyBluetoothCleared = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('bluetooth_cleared', callback)
      return () => socket.off('bluetooth_cleared', callback)
    }
    return () => {}
  }, [socket])

  const onUserTyping = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user_typing', callback)
      return () => socket.off('user_typing', callback)
    }
    return () => {}
  }, [socket])

  const onUserStoppedTyping = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user_stopped_typing', callback)
      return () => socket.off('user_stopped_typing', callback)
    }
    return () => {}
  }, [socket])

  const removeAllListeners = useCallback(() => {
    if (socket) {
      socket.removeAllListeners()
    }
  }, [socket])

  return {
    socket,
    isConnected,
    connectionState,
    connectionError,
    connect,
    disconnect,
    reconnect,
    getHealthStatus,
    sendFriendRequestNotification,
    sendFriendResponseNotification,
    sendMessage,
    startTyping,
    stopTyping,
    onFriendRequestReceived,
    onFriendRequestResponse,
    onMessageReceived,
    onUserStatusChanged,
    onUserTyping,
    onUserStoppedTyping,
  onNearbyBluetoothUpdate,
  onNearbyBluetoothCleared,
    removeAllListeners,
    // HTTP Fallback functions
    sendMessageFallback,
    getPresenceFallback,
    pollMessagesFallback
  }
}