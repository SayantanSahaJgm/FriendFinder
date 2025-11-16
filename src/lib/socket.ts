import io from 'socket.io-client'

// Socket.IO client configuration
// Build the client socket URL from env vars when provided.
// Priority: NEXT_PUBLIC_SOCKET_URL > NEXT_PUBLIC_SOCKET_PORT (same host with port) > localhost:3004
let SOCKET_URL = 'http://localhost:3004'
if (typeof window !== 'undefined') {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL
  } else if (process.env.NEXT_PUBLIC_SOCKET_PORT) {
    SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:${process.env.NEXT_PUBLIC_SOCKET_PORT}`
  } else if (process.env.NODE_ENV === 'production') {
    SOCKET_URL = window.location.origin
  }
} else {
  // Server-side build fallback
  SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || `http://localhost:${process.env.NEXT_PUBLIC_SOCKET_PORT || '3004'}`
}

class SocketService {
  private socket: any = null
  private userId: string | null = null

  connect(userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected && this.userId === userId) {
        resolve(this.socket)
        return
      }

      // Disconnect existing connection if different user
      if (this.socket && this.userId !== userId) {
        this.socket.disconnect()
      }

      // Prefer a polling-first handshake so many proxies/load-balancers
      // that don't support direct websocket upgrades can establish a connection
      // and then upgrade to websocket. Also include explicit path and
      // withCredentials so cookies/auth can be sent when needed.
      console.log('SocketService connecting to', SOCKET_URL)
      this.socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        path: '/socket.io/',
        withCredentials: true,
        timeout: 15000,
      })

      this.socket.on('connect', () => {
        console.log('Connected to Socket.IO server:', this.socket?.id)
        this.userId = userId
        this.socket?.emit('authenticate', userId)
        resolve(this.socket!)
      })

      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', error)
        reject(error)
      })

      this.socket.on('disconnect', (reason: string) => {
        console.log('Disconnected from Socket.IO server:', reason)
        this.userId = null
      })
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.userId = null
    }
  }

  // Message methods
  sendMessage(conversationId: string, message: {
    id: string
    content: string
    senderId: string
    timestamp: string
    type: 'text' | 'image' | 'file'
  }) {
    this.socket?.emit('message:send', { conversationId, message })
  }

  onMessageReceived(callback: (data: {
    conversationId: string
    message: {
      id: string
      content: string
      senderId: string
      timestamp: string
      type: 'text' | 'image' | 'file'
    }
  }) => void) {
    this.socket?.on('message:receive', callback)
  }

  markMessageAsRead(conversationId: string, messageId: string, userId: string) {
    this.socket?.emit('message:read', { conversationId, messageId, userId })
  }

  onMessageRead(callback: (data: {
    messageId: string
    userId: string
    conversationId: string
  }) => void) {
    this.socket?.on('message:read', callback)
  }

  // Conversation methods
  joinConversation(conversationId: string) {
    this.socket?.emit('join:conversation', conversationId)
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave:conversation', conversationId)
  }

  // Typing indicators
  startTyping(conversationId: string, userId: string, userName: string) {
    this.socket?.emit('typing:start', { conversationId, userId, userName })
  }

  stopTyping(conversationId: string, userId: string) {
    this.socket?.emit('typing:stop', { conversationId, userId })
  }

  onTypingStart(callback: (data: {
    userId: string
    userName: string
    conversationId: string
  }) => void) {
    this.socket?.on('typing:start', callback)
  }

  onTypingStop(callback: (data: {
    userId: string
    conversationId: string
  }) => void) {
    this.socket?.on('typing:stop', callback)
  }

  // Presence methods
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline') {
    this.socket?.emit('presence:update', status)
  }

  onUserOnline(callback: (userId: string) => void) {
    this.socket?.on('user:online', callback)
  }

  onUserOffline(callback: (data: {
    userId: string
    lastSeen: string
  }) => void) {
    this.socket?.on('user:offline', callback)
  }

  onPresenceUpdate(callback: (data: {
    userId: string
    status: 'online' | 'away' | 'busy' | 'offline'
    lastSeen: string
  }) => void) {
    this.socket?.on('presence:update', callback)
  }

  // Friend request methods
  sendFriendRequest(recipientId: string, requesterId: string, requesterName: string) {
    this.socket?.emit('friend:request', { recipientId, requesterId, requesterName })
  }

  respondToFriendRequest(recipientId: string, requesterId: string, accepted: boolean, responderName: string) {
    this.socket?.emit('friend:response', { recipientId, requesterId, accepted, responderName })
  }

  onFriendRequest(callback: (data: {
    requesterId: string
    requesterName: string
    timestamp: string
  }) => void) {
    this.socket?.on('friend:request', callback)
  }

  onFriendResponse(callback: (data: {
    recipientId: string
    accepted: boolean
    responderName: string
    timestamp: string
  }) => void) {
    this.socket?.on('friend:response', callback)
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getUserId(): string | null {
    return this.userId
  }

  getSocket(): any {
    return this.socket
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners()
  }

  // Remove specific listener
  removeListener(event: string, callback?: Function) {
    if (callback) {
      this.socket?.off(event, callback)
    } else {
      this.socket?.off(event)
    }
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService

// Export types for TypeScript
export interface MessageData {
  id: string
  content: string
  senderId: string
  timestamp: string
  type: 'text' | 'image' | 'file'
}

export interface ConversationData {
  id: string
  participants: string[]
  lastMessage?: MessageData
  updatedAt: string
}

export interface TypingData {
  userId: string
  userName: string
  conversationId: string
}

export interface PresenceData {
  userId: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen: string
}
