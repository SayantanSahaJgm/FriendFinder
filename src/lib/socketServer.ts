import { Server as NetServer, createServer } from 'http'
import { Server as ServerIO } from 'socket.io'
// Lazily require ioredis to avoid hard compile-time failure when module isn't installed
let IORedis: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  IORedis = require('ioredis')
} catch (err) {
  IORedis = null
}
import { getToken } from 'next-auth/jwt'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import Message from '@/models/Message'
import RandomChatSession from '@/models/RandomChatSession'
import RandomChatQueue from '@/models/RandomChatQueue'
import { moderateContent } from '@/lib/content-moderation'

// Module-level variable to store the Socket.IO instance
let ioInstance: ServerIO | null = null

export interface SocketUser {
  id: string
  username: string
  email: string
  socketId: string
}

export interface ServerToClientEvents {
  'message:received': (message: any) => void
  'message:delivered': (messageId: string) => void
  'message:read': (messageId: string) => void
  'user:online': (userId: string) => void
  'user:offline': (userId: string) => void
  'typing:start': (data: { chatId: string; userId: string; username: string }) => void
  'typing:stop': (data: { chatId: string; userId: string }) => void
  'friend:request': (data: any) => void
  'friend:accepted': (data: any) => void
  // Random Chat Events
  'random-chat:match-found': (data: any) => void
  'random-chat:message-received': (message: any) => void
  'random-chat:partner-typing': () => void
  'random-chat:partner-stopped-typing': () => void
  'random-chat:partner-left': () => void
  'random-chat:session-ended': (reason: string) => void
  'random-chat:queue-position': (data: { position: number; estimatedWait: number }) => void
  // WebRTC Events for Random Chat
  'random-chat:webrtc-offer-received': (data: { sessionId: string; offer: RTCSessionDescriptionInit }) => void
  'random-chat:webrtc-answer-received': (data: { sessionId: string; answer: RTCSessionDescriptionInit }) => void
  'random-chat:webrtc-ice-candidate-received': (data: { sessionId: string; candidate: RTCIceCandidate }) => void
  // Partner verification event (broadcast when a participant verifies their face)
  'random-chat:partner-verified': (data: { sessionId: string; userAnonymousId?: string; isVerified: boolean; confidence?: number; timestamp?: number }) => void
  'error': (message: string) => void
  // Location events
  'location:changed'?: (data: any) => void
  'location:updated'?: (data: any) => void
  'location:unavailable'?: (data: { friendId: string }) => void
  'location:response'?: (data: any) => void
}

export interface ClientToServerEvents {
  'message:send': (data: {
    chatId: string
    receiverId: string
    content: string
    type?: 'text' | 'image' | 'file'
  }) => void
  'message:read': (data: { chatId: string; messageId?: string }) => void
  'typing:start': (data: { chatId: string; receiverId: string }) => void
  'typing:stop': (data: { chatId: string; receiverId: string }) => void
  'user:join': () => void
  // Random Chat Events
  'random-chat:join-queue': (preferences: any) => void
  'random-chat:leave-queue': () => void
  'random-chat:message-send': (data: {
    sessionId: string
    content: string
    type?: 'text' | 'image'
  }) => void
  'random-chat:typing-start': (sessionId: string) => void
  'random-chat:typing-stop': (sessionId: string) => void
  'random-chat:end-session': (sessionId: string) => void
  'random-chat:join-session': (sessionId: string) => void
  // WebRTC Events for Random Chat
  'random-chat:webrtc-offer': (data: { sessionId: string; offer: RTCSessionDescriptionInit }) => void
  'random-chat:webrtc-answer': (data: { sessionId: string; answer: RTCSessionDescriptionInit }) => void
  'random-chat:webrtc-ice-candidate': (data: { sessionId: string; candidate: RTCIceCandidate }) => void
  // Client emits verification results which server will forward to the session room
  'random-chat:verification': (data: { sessionId: string; userAnonymousId?: string; isVerified: boolean; confidence?: number; timestamp?: number }) => void
  // Location events
  'location:update'?: (data: { latitude: number; longitude: number; accuracy?: number }) => void
  'location:request'?: (data: { friendId: string }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  user: SocketUser
}

export type SocketIOServer = ServerIO<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

export type SocketIOSocket = Parameters<Parameters<SocketIOServer['on']>[1]>[0]

// Store online users
const onlineUsers = new Map<string, SocketUser>()

// In-memory anonymous queue and sessions for quick anonymous matching (no DB changes)
const anonymousQueue: Map<string, {
  socketId: string;
  anonymousId: string;
  preferences: any;
  joinedAt: number;
}> = new Map()

const anonymousSessions: Map<string, {
  sessionId: string;
  participants: string[]; // socketIds
  createdAt: number;
  preferences: any;
}> = new Map()

// Optional Redis client for distributed anonymous queue/session storage
let redisClient: any = null
const useRedis = !!process.env.REDIS_URL
if (useRedis) {
  try {
    redisClient = new IORedis(process.env.REDIS_URL as string)
    redisClient.on('error', (err: any) => console.error('Redis error:', err))
    console.log('Connected to Redis for anonymous matching')
  } catch (err: any) {
    console.error('Failed to initialize Redis client:', err)
    redisClient = null
  }
}

async function pushAnonQueueRedis(chatType: string, payloadStr: string) {
  if (!redisClient) return
  const key = `anonQueue:${chatType}`
  await redisClient.rpush(key, payloadStr)
}

// Attempt to pop two entries atomically from the Redis list for chatType
async function tryPopPairFromRedis(chatType: string) {
  if (!redisClient) return null
  const key = `anonQueue:${chatType}`
  const multi = redisClient.multi()
  multi.lpop(key)
  multi.lpop(key)
  const res = await multi.exec()
  if (!res) return null
  const [a, b] = (res as any).map((r: any) => Array.isArray(r) && r[1] ? r[1] : null)
  if (a && b) {
    try {
      return [JSON.parse(a), JSON.parse(b)]
    } catch (e) {
      return null
    }
  }
  // If not both available, push back any popped entry
  if (a) await redisClient.lpush(key, a)
  if (b) await redisClient.lpush(key, b)
  return null
}

async function removeAnonQueueEntryRedis(chatType: string, payloadStr: string) {
  if (!redisClient) return
  const key = `anonQueue:${chatType}`
  try {
    await redisClient.lrem(key, 0, payloadStr)
  } catch (e) {
    console.warn('Redis LREM failed', e)
  }
}

async function storeAnonSessionRedis(sessionId: string, sessionObj: any) {
  if (!redisClient) return
  const key = `anonSession:${sessionId}`
  try {
    await redisClient.set(key, JSON.stringify(sessionObj), 'EX', 60 * 60) // 1 hour TTL
  } catch (e) {
    console.warn('Failed to store anon session in redis', e)
  }
}

async function getAnonSessionRedis(sessionId: string) {
  if (!redisClient) return null
  const key = `anonSession:${sessionId}`
  try {
    const val = await redisClient.get(key)
    if (!val) return null
    return JSON.parse(val)
  } catch (e) {
    console.warn('Failed to read anon session from redis', e)
    return null
  }
}

// Random Chat Matching Service
let matchingInterval: NodeJS.Timeout | null = null

const startRandomChatMatching = (io: SocketIOServer) => {
  if (matchingInterval) {
    clearInterval(matchingInterval)
  }

  matchingInterval = setInterval(async () => {
    try {
      await performRandomChatMatching(io)
    } catch (error) {
      console.error('Error in random chat matching:', error)
    }
  }, 5000) // Run every 5 seconds

  console.log('Random chat matching service started')
}

const stopRandomChatMatching = () => {
  if (matchingInterval) {
    clearInterval(matchingInterval)
    matchingInterval = null
    console.log('Random chat matching service stopped')
  }
}

const performRandomChatMatching = async (io: SocketIOServer) => {
  try {
    await dbConnect()
    
    // Get all active queue entries and randomize order to avoid deterministic pairing
    let queueEntries = await RandomChatQueue.find({ isActive: true })
      .sort({ priority: -1, joinedAt: 1 })
      .lean();

    // Fisher-Yates shuffle to randomize matching order slightly while still favoring priority
    for (let i = queueEntries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = queueEntries[i]
      queueEntries[i] = queueEntries[j]
      queueEntries[j] = temp
    }
    
    if (queueEntries.length < 2) {
      return // Need at least 2 people to match
    }

    const processedUsers = new Set<string>()
    
    for (const entry of queueEntries) {
      if (processedUsers.has(entry.userId.toString())) {
        continue
      }
      
      // Find a match for this user
      const match = await (RandomChatQueue as any).findNextMatch(entry.userId, entry.preferences)
      
      if (match && !processedUsers.has(match.userId.toString())) {
        // Create session
        const sessionId = RandomChatSession.generateSessionId()
        
        const participants = [
          {
            userId: entry.userId,
            username: entry.username,
            anonymousId: entry.anonymousId,
            joinedAt: new Date(),
            isActive: true,
          },
          {
            userId: match.userId,
            username: match.username,
            anonymousId: match.anonymousId,
            joinedAt: new Date(),
            isActive: true,
          },
        ]

        const session = new RandomChatSession({
          sessionId,
          participants,
          status: 'active',
          chatType: entry.preferences.chatType,
          preferences: entry.preferences,
          metadata: {
            startTime: new Date(),
            messagesCount: 0,
            reportCount: 0,
          },
        })

        await session.save()
        
        // Remove both users from queue
        await RandomChatQueue.deleteMany({
          userId: { $in: [entry.userId, match.userId] },
        })
        
        // Notify both users
        // Build anonymized partner objects for both participants (no DB userId exposed)
        const partnerForEntry = {
          anonymousId: match.anonymousId,
          displayName: match.username || `Guest${match.anonymousId.slice(-4)}`,
          isActive: true,
          commonInterests: match.preferences?.interests || [],
        }

        const partnerForMatch = {
          anonymousId: entry.anonymousId,
          displayName: entry.username || `Guest${entry.anonymousId.slice(-4)}`,
          isActive: true,
          commonInterests: entry.preferences?.interests || [],
        }

        const matchData1 = {
          sessionId,
          partner: partnerForEntry,
          chatType: entry.preferences.chatType,
          userAnonymousId: entry.anonymousId,
        }

        const matchData2 = {
          sessionId,
          partner: partnerForMatch,
          chatType: entry.preferences.chatType,
          userAnonymousId: match.anonymousId,
        }

        // Log emitted payloads for debugging
        console.log('Emit random-chat:match-found (anonymized) ->', `user:${entry.userId}`, matchData1)
        console.log('Emit random-chat:match-found (anonymized) ->', `user:${match.userId}`, matchData2)

        io.to(`user:${entry.userId}`).emit('random-chat:match-found', matchData1)
        io.to(`user:${match.userId}`).emit('random-chat:match-found', matchData2)
        
        console.log(`Random chat match created: ${entry.anonymousId} <-> ${match.anonymousId}`)
        
        // Mark as processed
        processedUsers.add(entry.userId.toString())
        processedUsers.add(match.userId.toString())
      } else {
        // No match found, increment retry count
        await entry.incrementRetry()
        
        // Send queue position update
        const position = await RandomChatQueue.countDocuments({
          'preferences.chatType': entry.preferences.chatType,
          joinedAt: { $lt: entry.joinedAt },
          isActive: true,
        }) + 1
        
        const estimatedWait = Math.max(30, 300 - entry.retryCount * 30) // Decrease wait time estimate
        
        io.to(`user:${entry.userId}`).emit('random-chat:queue-position', {
          position,
          estimatedWait,
        })
      }
    }
    
    // Clean up old queue entries
    await (RandomChatQueue as any).cleanupOldEntries()
    
  } catch (error) {
    console.error('Error in performRandomChatMatching:', error)
  }
}

export function initializeSocketIO(server: NetServer): SocketIOServer {
  const io = new ServerIO<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    path: '/api/socket.io',
    addTrailingSlash: false,
    // CORS: allow the official origins in production but be permissive during
    // local development to avoid polling/XHR preflight problems while debugging.
    cors: {
      origin: (origin, callback) => {
        // Log origin for debugging when present
        if (origin) console.log('Socket.IO incoming origin:', origin)

        if (process.env.NODE_ENV !== 'production') {
          // Allow any origin in dev (convenience only)
          return callback(null, true)
        }

        const allowed = [
          process.env.NEXTAUTH_URL || 'http://localhost:3000',
          process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3001'
        ]

        if (!origin) return callback(new Error('Origin missing'), false)
        callback(null, allowed.includes(origin))
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    },
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Allow authenticated clients (with JWT) OR anonymous clients that set
      // socket.handshake.auth.anonymous = true and provide anonymousId.
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization
      if (token) {
        // Authenticated path
        const decoded = await getToken({
          req: {
            headers: {
              authorization: `Bearer ${token}`,
            },
          } as any,
          secret: process.env.NEXTAUTH_SECRET,
        })

        if (!decoded?.userId && !decoded?.email) {
          console.error('Socket auth: Invalid token - no userId or email in decoded token:', { 
            hasDecoded: !!decoded,
            decodedKeys: decoded ? Object.keys(decoded) : []
          })
          return next(new Error('Invalid token'))
        }

        // Get user from database - try userId first, fall back to email
        await dbConnect()
        let user
        
        console.log('Socket auth: Looking up user with:', { 
          userId: decoded.userId ? 'present' : 'missing',
          email: decoded.email ? decoded.email.substring(0, 3) + '***' : 'missing'
        })
        
        if (decoded.userId) {
          user = await User.findById(decoded.userId).select('username email')
        } else if (decoded.email) {
          user = await User.findOne({ email: decoded.email }).select('username email')
        }

        if (!user) {
          console.error('Socket auth: User not found in database. Decoded token had:', {
            userId: decoded.userId,
            email: decoded.email ? decoded.email.substring(0, 3) + '***' : null
          })
          return next(new Error('User not found'))
        }
        
        console.log('Socket auth: User found successfully:', {
          userId: (user._id as any).toString(),
          username: user.username
        })

        // Store user data in socket
        socket.data.user = {
          id: (user._id as any).toString(),
          username: user.username,
          email: user.email,
          socketId: socket.id,
        }

        return next()
      }

      // Anonymous path: allow socket to connect if client explicitly requests it
      const isAnonymous = socket.handshake.auth?.anonymous === true
      const anonymousId = socket.handshake.auth?.anonymousId || socket.handshake.query?.anonymousId
      const username = socket.handshake.auth?.username || anonymousId

      if (isAnonymous && anonymousId) {
        // Create a synthetic user id using a prefix so it doesn't collide with real DB ids
        socket.data.user = {
          id: `anon:${anonymousId}`,
          username: username,
          email: '',
          socketId: socket.id,
        }

        return next()
      }

      return next(new Error('Authentication token required'))
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', async (socket) => {
    const user = socket.data.user
    console.log(`User connected: ${user.username} (${socket.id})`)

    try {
      // Update user's last seen immediately on connection
      await dbConnect()
      await User.findByIdAndUpdate(user.id, { lastSeen: new Date() })

      // Add user to online users
      onlineUsers.set(user.id, user)

      // Join user to their personal room
      socket.join(`user:${user.id}`)

      // Broadcast user online status to friends
      await notifyFriendsOnlineStatus(user.id, true)

      console.log(`User ${user.username} is now online`)
    } catch (error) {
      console.error('Error updating user online status:', error)
    }

    // Handle user joining
    socket.on('user:join', async () => {
      try {
        // Update user's last seen
        await User.findByIdAndUpdate(user.id, { lastSeen: new Date() })
        
        // Join user to their personal room
        socket.join(`user:${user.id}`)
        
        console.log(`User ${user.username} joined their room`)
      } catch (error) {
        console.error('Error on user join:', error)
      }
    })

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { chatId, receiverId, content, type = 'text' } = data

        // Validate that users are friends
        const currentUser = await User.findById(user.id)
        const receiverUser = await User.findById(receiverId)

        if (!currentUser || !receiverUser) {
          socket.emit('error', 'User not found')
          return
        }

        if (!currentUser.isFriendWith(receiverId as any)) {
          socket.emit('error', 'Can only send messages to friends')
          return
        }

        // Create message
        const message = new Message({
          chatId,
          senderId: user.id,
          receiverId,
          content: content.trim(),
          type,
          status: 'sent',
        })

        await message.save()

        // Populate sender info
        await message.populate('senderId', 'username profilePicture')

        const messageData = {
          _id: message._id,
          chatId: message.chatId,
          senderId: {
            _id: message.senderId._id,
            username: (message.senderId as any).username,
            profilePicture: (message.senderId as any).profilePicture,
          },
          receiverId: message.receiverId,
          content: message.content,
          type: message.type,
          status: message.status,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        }

        // Send to receiver if online
        const receiverSocket = onlineUsers.get(receiverId)
        if (receiverSocket) {
          io.to(`user:${receiverId}`).emit('message:received', messageData)

          // Mark as delivered
          message.status = 'delivered'
          message.deliveredAt = new Date()
          await message.save()

          // Emit delivery confirmation with timestamp to the sender
          try {
            const deliveredPayload = {
              messageId: (message._id as any).toString(),
              deliveredAt: message.deliveredAt.toISOString(),
              chatId: message.chatId,
            }
            socket.emit('message:delivered', deliveredPayload)
          } catch (emitErr) {
            console.error('Failed to emit message:delivered payload:', emitErr)
            // Fallback to legacy string ID for older clients
            socket.emit('message:delivered', (message._id as any).toString())
          }
        }

        // Send confirmation to sender
        socket.emit('message:received', messageData)

        console.log(`Message sent from ${user.username} to ${receiverId}`)
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', 'Failed to send message')
      }
    })

    // Handle marking messages as read
    socket.on('message:read', async (data) => {
      try {
        const { chatId, messageId } = data

        if (messageId) {
          // Mark specific message as read
          const message = await Message.findById(messageId)
            if (message && message.receiverId.toString() === user.id) {
            message.status = 'read'
            message.readAt = new Date()
            await message.save()

            // Notify sender with read timestamp
            try {
              const readPayload = {
                messageId: messageId,
                readAt: message.readAt.toISOString(),
                chatId: chatId,
              }
              io.to(`user:${message.senderId}`).emit('message:read', readPayload)
            } catch (emitErr) {
              console.error('Failed to emit message:read payload:', emitErr)
              // Fallback to legacy string ID
              io.to(`user:${message.senderId}`).emit('message:read', messageId)
            }
          }
        } else {
          // Mark all messages in chat as read
          await Message.markAsRead(chatId, user.id)
        }
      } catch (error) {
        console.error('Error marking message as read:', error)
      }
    })

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      const { chatId, receiverId } = data
      const receiverSocket = onlineUsers.get(receiverId)
      
      if (receiverSocket) {
        io.to(`user:${receiverId}`).emit('typing:start', {
          chatId,
          userId: user.id,
          username: user.username,
        })
      }
    })

    socket.on('typing:stop', (data) => {
      const { chatId, receiverId } = data
      const receiverSocket = onlineUsers.get(receiverId)
      
      if (receiverSocket) {
        io.to(`user:${receiverId}`).emit('typing:stop', {
          chatId,
          userId: user.id,
        })
      }
    })

    // Random Chat Event Handlers
    
    // Join user to random chat session room
    socket.on('random-chat:join-session', async (sessionId: string) => {
      try {
        // For authenticated sessions, verify DB session.
        if (!user.id.toString().startsWith('anon:')) {
          const session = await RandomChatSession.findOne({
            sessionId,
            'participants.userId': user.id,
          })
          if (session) {
            socket.join(`random-chat:${sessionId}`)
            console.log(`User ${user.username} joined random chat session: ${sessionId}`)
          }
          return
        }

        // Anonymous sessions are held in-memory
        let anonSession = anonymousSessions.get(sessionId)
        if (!anonSession && redisClient) {
          // Try to load session descriptor from Redis
          const stored = await getAnonSessionRedis(sessionId)
          if (stored) {
            // attach light-weight local entry so we can accept joins
            anonSession = {
              sessionId: stored.sessionId,
              participants: [],
              createdAt: stored.createdAt,
              preferences: stored.preferences,
            }
            anonymousSessions.set(sessionId, anonSession)
          }
        }

        if (anonSession) {
          // Allow socket to join the session room if they are one of the participants
          // For Redis-backed sessions, we trust the match-found emission and let the client join
          socket.join(`random-chat:${sessionId}`)
          console.log(`Anonymous socket ${socket.id} joined anon session ${sessionId}`)
        }
      } catch (error) {
        console.error('Error joining random chat session:', error)
      }
    })

    // Handle random chat messages
    socket.on('random-chat:message-send', async (data) => {
      try {
        const { sessionId, content, type = 'text' } = data

        // For authenticated sessions, use DB session. For anonymous sessions, use in-memory store.
        let isAnonSession = false
        let session: any = null
        if (user.id.toString().startsWith('anon:')) {
          const anonSession = anonymousSessions.get(sessionId)
          if (!anonSession) {
            socket.emit('error', 'Session not found or inactive')
            return
          }
          isAnonSession = true
          session = anonSession
        } else {
          session = await RandomChatSession.findOne({
            sessionId,
            'participants.userId': user.id,
            status: 'active',
          })

          if (!session) {
            socket.emit('error', 'Session not found or inactive')
            return
          }
        }

        let anonymousId = ''
        if (isAnonSession) {
          anonymousId = socket.data.user.username || socket.data.user.id
          // If we don't have the anon session in-memory, try redis
          if (!session && redisClient) {
            const stored = await getAnonSessionRedis(sessionId)
            if (stored) {
              // prepare a local placeholder so message relaying can happen for sockets on this instance
              anonymousSessions.set(sessionId, {
                sessionId: stored.sessionId,
                participants: [],
                createdAt: stored.createdAt,
                preferences: stored.preferences,
              })
              session = anonymousSessions.get(sessionId) as any
            }
          }
        } else {
          const userId = new mongoose.Types.ObjectId(user.id)
          anonymousId = session.getAnonymousId(userId)
          if (!anonymousId) {
            socket.emit('error', 'Invalid session state')
            return
          }
        }

        // Basic content filtering
        const filteredContent = content.trim()
        if (!filteredContent || filteredContent.length > 1000) {
          socket.emit('error', 'Invalid message content')
          return
        }

        // Apply content moderation
        const moderationResult = moderateContent(filteredContent, user.id)
        if (!moderationResult.isAllowed) {
          socket.emit('error', moderationResult.reason || 'Message blocked by content filter')
          return
        }

        // For authenticated sessions, persist message. For anonymous sessions, relay in-memory.
        if (!isAnonSession) {
          const userId = new mongoose.Types.ObjectId(user.id)
          await session.addMessage(userId, anonymousId, moderationResult.filteredContent || filteredContent, type)

          const messageData = {
            messageId: session.messages[session.messages.length - 1].messageId,
            sessionId,
            anonymousId,
            content: moderationResult.filteredContent || filteredContent,
            timestamp: new Date(),
            type,
            isOwn: false,
          }

          socket.to(`random-chat:${sessionId}`).emit('random-chat:message-received', messageData)
          socket.emit('random-chat:message-received', { ...messageData, isOwn: true })
          console.log(`Random chat message sent in session ${sessionId}`)
        } else {
          // Anonymous: relay message to other participant sockets in the anon session
          const msgPayload = {
            messageId: `anon_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
            sessionId,
            anonymousId,
            content: moderationResult.filteredContent || filteredContent,
            timestamp: new Date(),
            type,
            isOwn: false,
          }

          // Emit to other sockets in this anon session
          const participants = session.participants || []
          participants.forEach((sId: string) => {
            if (sId !== socket.id) {
              io.to(sId).emit('random-chat:message-received', msgPayload)
            }
          })

          // Echo to sender with isOwn flag
          socket.emit('random-chat:message-received', { ...msgPayload, isOwn: true })
          console.log(`Relayed anon random chat message in session ${sessionId}`)
        }
      } catch (error) {
        console.error('Error sending random chat message:', error)
        socket.emit('error', 'Failed to send message')
      }
    })

    // Handle random chat typing indicators
    socket.on('random-chat:typing-start', (sessionId: string) => {
      socket.to(`random-chat:${sessionId}`).emit('random-chat:partner-typing')
    })

    socket.on('random-chat:typing-stop', (sessionId: string) => {
      socket.to(`random-chat:${sessionId}`).emit('random-chat:partner-stopped-typing')
    })

    // Anonymous: join queue via socket (authenticated users use REST API)
    socket.on('random-chat:join-queue', async (preferences: any) => {
      try {
        if (!socket.data.user || !socket.data.user.id.toString().startsWith('anon:')) {
          // Only handle anonymous queue via socket here
          return
        }

        const anonId = socket.data.user.username || socket.data.user.id.replace('anon:', '')
        const username = socket.data.user.username || anonId
        const chatType = preferences?.chatType || 'text'

        // If Redis is configured, push into Redis queue and attempt to pop a pair atomically
        if (redisClient) {
          const payload = { anonId, username, joinedAt: Date.now(), chatType, preferences: preferences || {} }
          const payloadStr = JSON.stringify(payload)
          await pushAnonQueueRedis(chatType, payloadStr)

          // Try to pop pair
          const pair = await tryPopPairFromRedis(chatType)
          if (pair && pair.length === 2) {
            const a = pair[0]
            const b = pair[1]
            // Create session
            const sessionId = `anon_session_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
            const sessionObj = {
              sessionId,
              participants: [a.anonId, b.anonId],
              createdAt: Date.now(),
              preferences: a.preferences,
            }

            // Store session in Redis for cross-instance retrieval (TTL 1 hour)
            await storeAnonSessionRedis(sessionId, sessionObj)

            // Also keep local copy if both sockets are on this instance
            anonymousSessions.set(sessionId, {
              sessionId,
              participants: [],
              createdAt: Date.now(),
              preferences: a.preferences,
            })

            // Notify participants by their user room (works across instances if adapter is configured)
            const partnerA = { anonymousId: b.anonId, username: b.username || b.anonId, isActive: true }
            const partnerB = { anonymousId: a.anonId, username: a.username || a.anonId, isActive: true }
            io.to(`user:anon:${a.anonId}`).emit('random-chat:match-found', { sessionId, partner: partnerA, chatType: a.chatType, userAnonymousId: a.anonId })
            io.to(`user:anon:${b.anonId}`).emit('random-chat:match-found', { sessionId, partner: partnerB, chatType: a.chatType, userAnonymousId: b.anonId })

            console.log(`Redis anonymous match created: ${a.anonId} <-> ${b.anonId} (session ${sessionId})`)
            return
          }

          // No immediate match; send queue position info (best-effort)
          try {
            const len = await redisClient.llen(`anonQueue:${chatType}`)
            socket.emit('random-chat:queue-position', { position: len, estimatedWait: 30 })
          } catch (e) {
            socket.emit('random-chat:queue-position', { position: 1, estimatedWait: 30 })
          }

          return
        }

        // Fallback: in-memory first-fit matching (single-instance)
        // Add to in-memory queue
        anonymousQueue.set(anonId, {
          socketId: socket.id,
          anonymousId: anonId,
          username: username,
          preferences: preferences || { chatType: 'text' },
          joinedAt: Date.now(),
        })

        // Try to find a match: simple first-fit for same chatType
        const entries = Array.from(anonymousQueue.values())
        const me = entries.find(e => e.socketId === socket.id)
        if (!me) return

        const match = entries.find(e => e.socketId !== socket.id && e.preferences?.chatType === me.preferences?.chatType)
        if (match) {
          // Create anonymous session
          const sessionId = `anon_session_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
          anonymousSessions.set(sessionId, {
            sessionId,
            participants: [me.socketId, match.socketId],
            createdAt: Date.now(),
            preferences: me.preferences,
          })

          // Join sockets to room
          socket.join(`random-chat:${sessionId}`)
          const otherSocket = io.sockets.sockets.get(match.socketId)
          if (otherSocket) otherSocket.join(`random-chat:${sessionId}`)

          // Remove from queue
          anonymousQueue.delete(me.anonymousId)
          anonymousQueue.delete(match.anonymousId)

          // Notify both participants with proper usernames
          const payloadA = { sessionId, partner: { anonymousId: match.anonymousId, username: match.username || match.anonymousId, isActive: true }, chatType: me.preferences.chatType, userAnonymousId: me.anonymousId }
          const payloadB = { sessionId, partner: { anonymousId: me.anonymousId, username: me.username || me.anonymousId, isActive: true }, chatType: me.preferences.chatType, userAnonymousId: match.anonymousId }

          socket.emit('random-chat:match-found', payloadA)
          if (otherSocket) otherSocket.emit('random-chat:match-found', payloadB)

          console.log(`Anonymous match created: ${me.anonymousId} <-> ${match.anonymousId} (session ${sessionId})`)
        } else {
          // Send queue position
          const pos = entries.filter(e => e.preferences?.chatType === me.preferences?.chatType).length
          socket.emit('random-chat:queue-position', { position: pos, estimatedWait: 30 })
        }
      } catch (err) {
        console.error('Error handling anon join-queue:', err)
      }
    })

    // Anonymous: leave queue
    socket.on('random-chat:leave-queue', () => {
      try {
        if (!socket.data.user || !socket.data.user.id.toString().startsWith('anon:')) return
        const anonId = socket.data.user.username || socket.data.user.id.replace('anon:', '')
        if (redisClient) {
          // remove any matching entries from Redis lists across chat types (best-effort)
          // We don't know chatType here; try common types
          const typesToTry = ['text', 'voice', 'video']
          typesToTry.forEach(async (t) => {
            const payload = JSON.stringify({ anonId, joinedAt: 0, chatType: t, preferences: {} })
            await removeAnonQueueEntryRedis(t, payload)
          })
        }

        anonymousQueue.delete(anonId)
      } catch (err) {
        console.error('Error handling anon leave-queue:', err)
      }
    })

    // Handle ending random chat session
    socket.on('random-chat:end-session', async (sessionId: string) => {
      try {
        const session = await RandomChatSession.findOne({
          sessionId,
          'participants.userId': user.id,
          status: { $in: ['waiting', 'active'] },
        })

        if (session) {
          // End the session
          await session.endSession('user_left')
          
          // Notify partner
          socket.to(`random-chat:${sessionId}`).emit('random-chat:partner-left')
          
          // Notify all participants that session ended
          io.to(`random-chat:${sessionId}`).emit('random-chat:session-ended', 'user_left')
          
          // Remove users from session room
          const socketsInRoom = await io.in(`random-chat:${sessionId}`).fetchSockets()
          socketsInRoom.forEach(s => s.leave(`random-chat:${sessionId}`))
          
          console.log(`Random chat session ${sessionId} ended by ${user.username}`)
        }
      } catch (error) {
        console.error('Error ending random chat session:', error)
      }
    })

    // WebRTC Event Handlers for Random Chat
    
    // Handle WebRTC offer
    socket.on('random-chat:webrtc-offer', (data: { sessionId: string; offer: RTCSessionDescriptionInit }) => {
      socket.to(`random-chat:${data.sessionId}`).emit('random-chat:webrtc-offer-received', data)
    })

    // Handle WebRTC answer
    socket.on('random-chat:webrtc-answer', (data: { sessionId: string; answer: RTCSessionDescriptionInit }) => {
      socket.to(`random-chat:${data.sessionId}`).emit('random-chat:webrtc-answer-received', data)
    })

    // Handle ICE candidates
    socket.on('random-chat:webrtc-ice-candidate', (data: { sessionId: string; candidate: RTCIceCandidate }) => {
      socket.to(`random-chat:${data.sessionId}`).emit('random-chat:webrtc-ice-candidate-received', data)
    })

    // Handle client verification events and forward to session participants
    socket.on('random-chat:verification', (data: { sessionId: string; userAnonymousId?: string; isVerified: boolean; confidence?: number; timestamp?: number }) => {
      try {
        if (!data || !data.sessionId) return

        const payload = {
          sessionId: data.sessionId,
          userAnonymousId: data.userAnonymousId || undefined,
          isVerified: !!data.isVerified,
          confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
          timestamp: data.timestamp || Date.now(),
        }

        // Forward to other participants in the session room
        socket.to(`random-chat:${data.sessionId}`).emit('random-chat:partner-verified', payload)
        console.log(`Forwarded verification for session ${data.sessionId}:`, payload)
      } catch (err) {
        console.error('Error forwarding verification event:', err)
      }
    })

    // Location Event Handlers
    
    // Handle location update broadcast
    socket.on('location:update', async (data: { latitude: number; longitude: number; accuracy?: number }) => {
      try {
        const { latitude, longitude, accuracy } = data

        // Validate coordinates
        if (
          typeof latitude !== 'number' ||
          typeof longitude !== 'number' ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          socket.emit('error', 'Invalid coordinates')
          return
        }

        // Update location in database
        await dbConnect()
        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          {
            $set: {
              location: {
                type: 'Point',
                coordinates: [longitude, latitude],
                accuracy: accuracy || null,
                lastUpdated: new Date(),
              },
              lastSeen: new Date(),
            },
          },
          { new: true, select: 'friends username location' }
        ).populate('friends', '_id')

        if (!updatedUser) {
          socket.emit('error', 'User not found')
          return
        }

        // Broadcast location to all friends
        const locationData = {
          userId: user.id,
          username: user.username,
          location: {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy || null,
          },
          timestamp: new Date().toISOString(),
        }

        // Respect user's privacy settings before broadcasting
        try {
          const settings = (updatedUser as any).settings || {}

          // If the user has disabled location sharing entirely, do not broadcast
          if (settings.locationSharing === false) {
            console.log(`Location update for ${user.username} suppressed due to locationSharing=false`)
          } else {
            // Build list of friend IDs (normalize to strings)
            const friendIds: string[] = (updatedUser.friends || []).map((f: any) => {
              // populated friend doc or raw ObjectId
              return f && f._id ? f._id.toString() : (f ? f.toString() : '')
            }).filter(Boolean)

            // If an allow-list exists, restrict recipients to those included
            let recipients = friendIds
            if (Array.isArray(settings.locationVisibleTo) && settings.locationVisibleTo.length > 0) {
              const allowSet = new Set(settings.locationVisibleTo.map((id: any) => (id.toString ? id.toString() : id)))
              recipients = friendIds.filter(id => allowSet.has(id))
            }

            // Emit to each allowed friend
            recipients.forEach((friendId) => {
              io.to(`user:${friendId}`).emit('location:changed', locationData)
            })

            console.log(`Location updated for ${user.username} and broadcast to ${recipients.length} friends`)
          }
        } catch (err) {
          console.error('Error while applying location-sharing settings:', err)
        }
      } catch (error) {
        console.error('Error handling location update:', error)
        socket.emit('error', 'Failed to update location')
      }
    })

    // Handle location request (get specific friend's location)
    socket.on('location:request', async (data: { friendId: string }) => {
      try {
        const { friendId } = data

        await dbConnect()
        
        // Verify friendship
        const currentUser = await User.findById(user.id).select('friends')
        if (!currentUser || !currentUser.friends.some((fId: any) => fId.toString() === friendId)) {
          socket.emit('error', 'Not friends with this user')
          return
        }

        // Get friend's location
        const friend = await User.findById(friendId).select('username location lastSeen isOnline')
        if (!friend || !friend.location) {
          socket.emit('location:unavailable', { friendId })
          return
        }

        // Send location to requester
        socket.emit('location:response', {
          userId: friendId,
          username: friend.username,
          location: {
            lat: friend.location.coordinates[1],
            lng: friend.location.coordinates[0],
            accuracy: friend.location.accuracy || null,
            lastUpdated: friend.location.lastUpdated,
          },
          isOnline: friend.isOnline || false,
        })
      } catch (error) {
        console.error('Error handling location request:', error)
        socket.emit('error', 'Failed to get location')
      }
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.username} (${socket.id})`)
      
      // If anonymous, clean up in-memory queue and sessions
      try {
        if (socket.data.user && socket.data.user.id && socket.data.user.id.toString().startsWith('anon:')) {
          const anonId = socket.data.user.username || socket.data.user.id.replace('anon:', '')
          // Remove from Redis-backed queue if present
          if (redisClient) {
            const typesToTry = ['text', 'voice', 'video']
            typesToTry.forEach(async (t) => {
              const payload = JSON.stringify({ anonId, joinedAt: 0, chatType: t, preferences: {} })
              await removeAnonQueueEntryRedis(t, payload)
            })
          }
          anonymousQueue.delete(anonId)

          // End any anonymous session involving this socket
          for (const [sid, srec] of Array.from(anonymousSessions.entries())) {
            if (srec.participants.includes(socket.id)) {
              // Notify other participant
              srec.participants.forEach((psid) => {
                if (psid !== socket.id) {
                  io.to(psid).emit('random-chat:partner-left')
                  io.to(psid).emit('random-chat:session-ended', 'partner_left')
                }
              })
              anonymousSessions.delete(sid)
              console.log(`Anonymous session ${sid} ended because ${anonId} disconnected`)
            }
          }
        }
      } catch (err) {
        console.error('Error cleaning up anonymous state on disconnect:', err)
      }

      // Remove from online users
      onlineUsers.delete(user.id)
      
      // Update last seen for authenticated users
      try {
        if (!socket.data.user.id.toString().startsWith('anon:')) {
          await User.findByIdAndUpdate(user.id, { lastSeen: new Date() })
          
          // Notify friends that user is offline
          await notifyFriendsOnlineStatus(user.id, false)
          
          console.log(`User ${user.username} is now offline`)
        }
      } catch (error) {
        console.error('Error updating last seen:', error)
      }
    })
  })

  // Start random chat matching service
  startRandomChatMatching(io)

  // Start a small debug HTTP endpoint for random chat (queue/session inspection)
  try {
    startRandomChatDebugServer(io)
  } catch (err) {
    console.error('Failed to start random chat debug server:', err)
  }

  // Store the io instance for access from API routes
  ioInstance = io

  return io
}

// Debug HTTP endpoint to inspect random chat queue and active sessions
function startRandomChatDebugServer(io: SocketIOServer) {
  const port = parseInt(process.env.RANDOM_CHAT_DEBUG_PORT || '3010', 10)

  const server = createServer(async (req, res) => {
    try {
      if (!req.url || req.method !== 'GET') {
        res.writeHead(404)
        res.end('Not Found')
        return
      }

      if (req.url.startsWith('/debug/random-chat')) {
        // Gather data
        await dbConnect()

        const queueCount = await RandomChatQueue.countDocuments({ isActive: true })
        const queuePreviewDocs = await RandomChatQueue.find({ isActive: true })
          .sort({ joinedAt: 1 })
          .limit(20)
          .select('userId anonymousId preferences joinedAt retryCount')
          .lean()

        const sessionsCount = await RandomChatSession.countDocuments({ status: 'active' })
        const sessionsPreview = await RandomChatSession.find({ status: 'active' })
          .sort({ 'metadata.startTime': -1 })
          .limit(20)
          .select('sessionId participants chatType metadata')
          .lean()

        const payload = {
          timestamp: new Date().toISOString(),
          queue: {
            count: queueCount,
            preview: queuePreviewDocs,
          },
          sessions: {
            count: sessionsCount,
            preview: sessionsPreview,
          },
          onlineUsers: Array.from(onlineUsers.keys()).slice(0, 50),
        }

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        })
        res.end(JSON.stringify(payload, null, 2))
        return
      }

      res.writeHead(404)
      res.end('Not Found')
    } catch (err) {
      console.error('Error in debug endpoint:', err)
      res.writeHead(500)
      res.end(JSON.stringify({ error: String(err) }))
    }
  })

  server.listen(port, () => {
    console.log(`Random chat debug endpoint listening at http://localhost:${port}/debug/random-chat`)
  })
}

// Helper function to notify friends about online status changes
async function notifyFriendsOnlineStatus(userId: string, isOnline: boolean) {
  try {
    await dbConnect()
    
    // Get user's friends
    const user = await User.findById(userId).select('friends username').lean()
    if (!user) return

    // Get online users to check who to notify
    const friendsToNotify = user.friends.filter(friendId => {
      // Check if friend is currently online
      for (const [socketId, socketUser] of onlineUsers.entries()) {
        if (socketUser.id === friendId.toString()) {
          return true
        }
      }
      return false
    })

    // Get the global io instance  
    if (friendsToNotify.length > 0) {
      const io = (global as any).socketIO
      if (io) {
        // Notify each online friend
        friendsToNotify.forEach(friendId => {
          io.to(`user:${friendId.toString()}`).emit('user:online', {
            userId,
            username: user.username,
            isOnline,
            timestamp: new Date().toISOString()
          })
        })
      }
    }

    console.log(`Notified ${friendsToNotify.length} friends of ${user.username}'s status: ${isOnline ? 'online' : 'offline'}`)
  } catch (error) {
    console.error('Error notifying friends of status change:', error)
  }
}

export { onlineUsers, startRandomChatMatching, stopRandomChatMatching }

/**
 * Get the Socket.IO server instance
 * This allows API routes to emit socket events
 */
export function getIO(): ServerIO {
  if (!ioInstance) {
    throw new Error('Socket.IO server not initialized')
  }
  return ioInstance
}
