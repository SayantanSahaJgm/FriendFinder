const { createServer } = require("http");
const { Server } = require("socket.io");

// Determine socket port robustly:
// - If SOCKET_PORT is explicitly set, use it.
// - Else if a generic PORT is provided by the host (e.g. Render assigns PORT),
//   choose PORT+1 so Next.js can bind to PORT and the socket server uses a different port.
// - Otherwise fall back to 3004 for local development.
  // Prefer the platform-provided PORT when present. If a PaaS like Render
  // or Railway sets `PORT`, use it. Only fall back to SOCKET_PORT when
  // PORT is not available (local dev edge-case).
  let SOCKET_PORT;
  if (process.env.PORT) {
    const parsed = Number(process.env.PORT);
    SOCKET_PORT = Number.isFinite(parsed) ? parsed : 3004;
  } else if (process.env.SOCKET_PORT) {
    SOCKET_PORT = Number(process.env.SOCKET_PORT);
  } else {
    SOCKET_PORT = 3004;
  }

// Connection health tracking
let connectionHealth = {
  totalConnections: 0,
  activeConnections: 0,
  errorCount: 0,
  lastError: null,
  uptime: Date.now()
};

console.log('Starting Socket.IO server...');

// Create HTTP server for Socket.IO only
const socketServer = createServer();
// Upgrade logger is noisy; enable it only when debugging via env var
// Set SOCKET_DEBUG_UPGRADE=1 or SOCKET_DEBUG=1 to enable.
const enableUpgradeLogger = Boolean(
  process.env.SOCKET_DEBUG_UPGRADE === '1' || process.env.SOCKET_DEBUG === '1'
);
if (enableUpgradeLogger) {
  // Temporary debug: log raw HTTP upgrade requests so we can inspect WebSocket handshakes
  // (Keep this only while troubleshooting; remove once root cause is identified.)
  socketServer.on('upgrade', (req, socket, head) => {
    try {
      // Log a trimmed set of headers to avoid leaking secrets in logs
      const headers = {
        upgrade: req.headers.upgrade,
        connection: req.headers.connection,
        origin: req.headers.origin,
        host: req.headers.host,
        'sec-websocket-key': req.headers['sec-websocket-key'],
        'sec-websocket-version': req.headers['sec-websocket-version'],
        'sec-websocket-protocol': req.headers['sec-websocket-protocol']
      };
      console.log('HTTP upgrade request:', req.url, headers);
    } catch (e) {
      console.log('HTTP upgrade request received (unable to log headers)');
    }
  });
}
console.log(`Socket.IO upgrade logger: ${enableUpgradeLogger ? 'ENABLED' : 'disabled (set SOCKET_DEBUG_UPGRADE=1 to enable)'}`);

// Initialize Socket.IO with enhanced configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// Allow configuring allowed client origins via environment variable. Use a
// comma-separated list in `SOCKET_ALLOWED_ORIGINS` or `NEXT_PUBLIC_CLIENT_ORIGINS`.
const envOriginsRaw = process.env.SOCKET_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_CLIENT_ORIGINS || '';
const envOrigins = envOriginsRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Keep the project's historical production origins but include the primary deployed frontends so deployed frontends can connect by default.
const defaultProdOrigins = [
  'https://friendfinder-mu.vercel.app',
  'https://friendfinder-vscode.onrender.com',
  'https://friendfinder-production-8cd0.up.railway.app',
  process.env.NEXTAUTH_URL
].filter(Boolean);

const allowedOrigins = isDevelopment
  ? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003'
    ]
  : [...defaultProdOrigins, ...envOrigins].filter(Boolean);

// Log computed allowed origins so runtime logs show which client origins were permitted.
console.log('Socket.IO allowed origins:', allowedOrigins);

console.log('Socket.IO CORS origins:', allowedOrigins);

// Toggle to disable the Random Chat / WebRTC features (useful for
// deployments that should not host matchmaking or P2P signaling).
const randomChatDisabled = Boolean(process.env.DISABLE_RANDOM_CHAT === '1');
if (randomChatDisabled) console.log('Random Chat features are DISABLED via DISABLE_RANDOM_CHAT=1');

const io = new Server(socketServer, {
  path: "/socket.io/",
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Support WebSocket and polling; WebSocket is now properly supported on Render/Railway
  transports: ["websocket", "polling"],
  allowEIO3: true,
  // WebSocket upgrade timeout
  upgradeTimeout: 30000,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 20000,
  maxHttpBufferSize: 1e6,
  // Explicitly allow upgrades
  allowUpgrades: true,
  perMessageDeflate: false, // Disable compression to reduce upgrade handshake issues
  allowRequest: (req, callback) => {
    // Guard allowRequest to never call the callback more than once and
    // normalize origins for loose matching (strip trailing slashes, compare origin strings).
    try {
  const originHeader = req.headers.origin || '';
  // If origin is missing, try to reconstruct it from common proxy headers
  // (some hosting providers strip the Origin header on websocket upgrades)
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers['x-forwarded-server'] || '';
  const forwardedProto = req.headers['x-forwarded-proto'] || req.headers['x-forwarded-protocol'] || '';
  const reconstructedOrigin = (forwardedProto && forwardedHost) ? `${forwardedProto}://${forwardedHost}` : '';

      const normalize = (u) => {
        if (!u) return '';
        try {
          // Keep only the origin portion (scheme + host), and drop default ports
          const parsed = new URL(u);
          const protocol = parsed.protocol; // includes trailing ':'
          const hostname = parsed.hostname; // no port
          const port = parsed.port; // empty if default
          // Remove default ports (80 for http, 443 for https) from normalization
          const defaultPort = protocol === 'http:' ? '80' : protocol === 'https:' ? '443' : '';
          const portPart = port && port !== defaultPort ? `:${port}` : '';
          return `${protocol}//${hostname}${portPart}`.replace(/\/$/, '').toLowerCase();
        } catch (e) {
          // Fallback: trim and remove trailing slash
          return String(u).trim().replace(/\/$/, '').toLowerCase();
        }
      };

  // Prefer the real Origin header; fall back to reconstructed origin if present
  const origin = normalize(originHeader || reconstructedOrigin);

  const normalizedAllowed = allowedOrigins.map(normalize).filter(Boolean);
  // Debug: print normalized allowed origins occasionally (will show during allowRequest calls)
  // console.log('Normalized allowed origins:', normalizedAllowed);

      // If any allowed origin is a wildcard '*' then accept all origins
      const allowAll = normalizedAllowed.includes('*');

  const isLocalhost = isDevelopment && origin.includes('localhost');
  // Allow missing origin when explicitly enabled (trusted proxy scenario)
  const allowMissing = Boolean(process.env.SOCKET_ALLOW_MISSING_ORIGIN === '1');
  const isAllowed = allowAll || !origin && allowMissing || !origin || isLocalhost || normalizedAllowed.some(a => a === origin.toLowerCase());

      console.log(`Socket.IO connection request from ${originHeader || '<no-origin>'}: ${isAllowed ? 'ALLOWED' : 'DENIED'}`);

      // Ensure callback is invoked exactly once
      try {
        callback(null, Boolean(isAllowed));
      } catch (cbErr) {
        // If callback throws, log it but do not attempt to call again
        console.error('Error while invoking allowRequest callback:', cbErr);
      }
    } catch (err) {
      console.error('Error in allowRequest origin check:', err);
      try { callback(null, false); } catch (e) { /* ignore */ }
    }
  }
});

// Store io instance globally
global.socketIO = io;

// Wrap global io.emit to log broadcasts
try {
  const _origIoEmit = io.emit.bind(io);
  io.emit = function (event, ...args) {
    try {
      console.log('[IO EMIT]', event, args);
    } catch (e) {
      console.log('[IO EMIT]', event);
    }
    return _origIoEmit(event, ...args);
  };
} catch (e) {
  console.error('Failed to wrap io.emit for debugging:', e);
}

// Enhanced connection error handling
io.engine.on("connection_error", (err) => {
  console.error("Socket.IO connection error:", {
    req: err.req?.url,
    code: err.code,
    message: err.message,
    context: err.context
  });
  connectionHealth.errorCount++;
  connectionHealth.lastError = {
    timestamp: new Date().toISOString(),
    error: err.message,
    code: err.code
  };
});

// Socket.IO connection handling with enhanced error management
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  connectionHealth.totalConnections++;
  connectionHealth.activeConnections++;

  // Check for anonymous handshake (from RandomChatContext anonymous socket)
  const handshake = socket.handshake || {};
  const auth = handshake.auth || {};
  if (auth.anonymous && auth.anonymousId) {
    socket.isAnonymous = true;
    socket.anonymousId = auth.anonymousId;
    socket.userId = auth.anonymousId; // Use anonymousId as userId for queue tracking
    console.log(`Anonymous user connected: ${socket.anonymousId} (${socket.id})`);
    // Join a room so we can emit to this anonymous user later
    socket.join(`user:anon:${socket.anonymousId}`);
  }

  // Instrument emits for debugging: wrap socket.emit, socket.to(...).emit, broadcast and io.emit
  try {
    // Wrap per-socket emits
    const _origSocketEmit = socket.emit.bind(socket);
    socket.emit = function (event, ...args) {
      try {
        console.log(`[EMIT -> socket ${socket.id}]`, event, args);
      } catch (e) {
        console.log(`[EMIT -> socket ${socket.id}]`, event);
      }
      return _origSocketEmit(event, ...args);
    };

    // Wrap socket.to(room).emit
    const _origSocketTo = socket.to.bind(socket);
    socket.to = function (room) {
      const operator = _origSocketTo(room);
      try {
        const _origOpEmit = operator.emit.bind(operator);
        operator.emit = function (event, ...args) {
          try {
            console.log(`[BROADCAST -> room ${room}]`, event, args);
          } catch (e) {
            console.log(`[BROADCAST -> room ${room}]`, event);
          }
          return _origOpEmit(event, ...args);
        };
      } catch (e) {
        // ignore if operator binding fails
      }
      return operator;
    };

    // Wrap socket.broadcast.emit
    if (socket.broadcast && socket.broadcast.emit) {
      const _origBroadcastEmit = socket.broadcast.emit.bind(socket.broadcast);
      socket.broadcast.emit = function (event, ...args) {
        try {
          console.log(`[BROADCAST -> all except ${socket.id}]`, event, args);
        } catch (e) {
          console.log(`[BROADCAST -> all except ${socket.id}]`, event);
        }
        return _origBroadcastEmit(event, ...args);
      };
    }
  } catch (wrapErr) {
    console.error('Failed to wrap socket emitters for debugging:', wrapErr);
  }

  // Enhanced error handling for individual sockets
  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
    connectionHealth.errorCount++;
  });

  // Connection health monitoring
  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    connectionHealth.activeConnections--;
  });

  // User registration with error handling
  socket.on("user-register", (userData) => {
    try {
      // If already marked anonymous, update username but keep anonymousId
      if (socket.isAnonymous) {
        socket.username = userData.username || userData.anonymousName || socket.anonymousId;
        console.log(`Anonymous user registered: ${socket.username} (${socket.anonymousId})`);
      } else {
        socket.userId = userData.userId;
        socket.username = userData.username;
        // Join both room naming conventions used across the codebase so different clients
        // (legacy and newer) can receive events regardless of which convention they use.
        const roomA = `user-${userData.userId}`;
          const roomB = `user:${userData.userId}`;
          socket.join(roomA);
          socket.join(roomB);
          console.log(`User registered: ${userData.username} (${userData.userId})`);
          // Notify friends/clients that this user is online using both room naming conventions
          try {
            io.to(roomA).emit('user:online', { userId: userData.userId, username: userData.username });
            io.to(roomB).emit('user:online', { userId: userData.userId, username: userData.username });
          } catch (emitErr) {
            console.error('Error emitting user:online after registration:', emitErr);
          }
      }
      
      // Send connection confirmation
      socket.emit('connection-confirmed', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        userId: socket.userId || socket.anonymousId,
        isAnonymous: socket.isAnonymous || false
      });
    } catch (error) {
      console.error('Error in user-register:', error);
      socket.emit('error', 'Failed to register user');
    }
  });

  // Handle direct user-to-user message sends (persistent messaging)
  socket.on('message:send', async (data) => {
    try {
      // Normalize multiple client payload shapes for backward compatibility.
      // Accept: { chatId, receiverId, content }
      // Accept legacy: { conversationId, message: { content, senderId, receiverId } }
      // Accept alternate keys: recipientId, text
      const raw = data || {};
      const chatId = raw.chatId || raw.conversationId || raw.message?.chatId;
      const receiverId = raw.receiverId || raw.recipientId || raw.message?.receiverId || raw.message?.recipientId;
      const content = raw.content || raw.text || raw.message?.content || raw.message?.text;
      const type = raw.type || raw.message?.type || 'text';

      if (!socket.userId) {
        socket.emit('error', 'Not registered');
        return;
      }

      if (!receiverId || !chatId || !content || !content.trim()) {
        socket.emit('error', 'Invalid message payload');
        return;
      }

      // Try DB persistence if available, otherwise fall back to in-memory message object
      let messagePayload = null;
      let messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      try {
        // Lazy-load DB and models to avoid startup ordering issues
        const mongoose = require('mongoose');
        const dbConnect = require('./src/lib/mongoose').default;
        const User = require('./src/models/User').default;
        const Message = require('./src/models/Message').default;

        // Prepare outer-scope variables so we don't accidentally reference
        // block-scoped consts outside the DB try/catch (avoids ReferenceError)
        let sender = null;
        let receiver = null;
        let normalizedReceiverId = receiverId;

        await dbConnect();

        // Verify users exist: try by id first, then fallback to email lookup if receiverId looks like an email
        const senderId = socket.userId;
        sender = await User.findById(senderId).select('username');
        receiver = await User.findById(normalizedReceiverId).select('username');
        if (!receiver) {
          // try as email
          receiver = await User.findOne({ email: normalizedReceiverId }).select('username _id');
          if (receiver) {
            normalizedReceiverId = receiver._id.toString(); // normalize to id for room emits
          }
        }

        if (!sender || !receiver) {
          socket.emit('error', 'User not found');
          return;
        }

        if (typeof sender.isFriendWith === 'function' && !sender.isFriendWith(normalizedReceiverId)) {
          socket.emit('error', 'Can only send messages to friends');
          return;
        }

        // Persist message
        const messageDoc = new Message({
          chatId,
          senderId: senderId,
          receiverId: normalizedReceiverId,
          content: content.trim(),
          type,
          status: 'sent',
        });

        await messageDoc.save();

        // Populate lightweight sender info for client display
        await messageDoc.populate('senderId', 'username profilePicture');

        messageId = (messageDoc._id && messageDoc._id.toString()) || messageId;
        messagePayload = {
          _id: messageId,
          chatId: messageDoc.chatId,
          senderId: {
            _id: (messageDoc.senderId && messageDoc.senderId._id) ? messageDoc.senderId._id.toString() : senderId,
            username: (messageDoc.senderId && messageDoc.senderId.username) || (sender && sender.username) || 'unknown',
            profilePicture: (messageDoc.senderId && messageDoc.senderId.profilePicture) || null,
          },
          receiverId: messageDoc.receiverId,
          content: messageDoc.content,
          type: messageDoc.type,
          status: messageDoc.status,
          createdAt: messageDoc.createdAt,
          updatedAt: messageDoc.updatedAt,
        };
        // Make outer-scope sender/receiver available for logging below
        // (we already set sender/receiver variables above)
      } catch (dbErr) {
        // If DB modules are not available (dev environment without build), fall back to a lightweight payload
        console.log('DB persistence not available, falling back to in-memory message for demo:', dbErr && dbErr.code ? dbErr.code : dbErr);
        messagePayload = {
          _id: messageId,
          chatId,
          senderId: { _id: socket.userId, username: socket.username || 'unknown' },
          receiverId,
          content: content.trim(),
          type,
          status: 'sent',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Emit to receiver room (use same room naming convention used elsewhere)
      const receiverRoom = `user-${receiverId}`;

      // If receiver is connected (check both room naming conventions), forward message
      const roomA = `user-${receiverId}`;
      const roomB = `user:${receiverId}`;
      const roomAExists = io.sockets.adapter.rooms.get(roomA);
      const roomBExists = io.sockets.adapter.rooms.get(roomB);
      if ((roomAExists && roomAExists.size > 0) || (roomBExists && roomBExists.size > 0)) {
        // Emit to both rooms to be safe
        try { io.to(roomA).emit('message:received', messagePayload); } catch (e) {}
        try { io.to(roomB).emit('message:received', messagePayload); } catch (e) {}

        // Notify sender about delivery (include timestamp)
        const deliveredPayload = {
          messageId: messagePayload._id,
          deliveredAt: new Date().toISOString(),
          chatId: messagePayload.chatId,
        };
        socket.emit('message:delivered', deliveredPayload);
      }

      // Always echo message back to sender as confirmation
      socket.emit('message:received', messagePayload);
      // Safe logging: do not reference messageDoc when DB persistence failed
      try {
        // Logging: prefer DB-resolved sender/receiver when available
        const senderName = (typeof sender !== 'undefined' && sender && sender.username) ? sender.username : socket.username || socket.userId || 'unknown';
        const receiverName = (typeof receiver !== 'undefined' && receiver && receiver.username) ? receiver.username : (typeof normalizedReceiverId !== 'undefined' ? normalizedReceiverId : receiverId) || 'unknown';
        console.log(`Message saved: ${senderName} -> ${receiverName} (id: ${messagePayload._id})`);
      } catch (logErr) {
        console.log('Message saved, unable to log friendly names:', logErr);
      }
    } catch (err) {
      console.error('Error handling message:send:', err);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle marking messages as read from clients
  socket.on('message:read', async (data) => {
    try {
      const { chatId, messageId } = data || {};
      if (!socket.userId) return;
      // Try DB persistence if available, otherwise emit a read notification directly
      try {
        const dbConnect = require('./src/lib/mongoose').default;
        const Message = require('./src/models/Message').default;
        await dbConnect();

        if (messageId) {
          const msg = await Message.findById(messageId);
          if (!msg) return;
          if (msg.receiverId.toString() !== socket.userId.toString()) return;

          msg.status = 'read';
          msg.readAt = new Date();
          await msg.save();

          const senderRoom = `user-${msg.senderId}`;
          io.to(senderRoom).emit('message:read', {
            messageId: msg._id.toString(),
            readAt: msg.readAt.toISOString(),
            chatId: chatId || msg.chatId,
          });
        } else if (chatId) {
          await Message.markAsRead(chatId, socket.userId);
        }
      } catch (dbErr) {
        // Fallback: directly notify sender(s) that message was read (best-effort)
        const readPayload = {
          messageId: messageId || null,
          readAt: new Date().toISOString(),
          chatId: chatId || null,
        };

        if (messageId) {
          // Emit to sender room name pattern 'user-<senderId>' is unknown without DB, so try both naming conventions
          // If the client provided senderId in payload (not mandatory), use it; otherwise broadcast to all for demo
          io.emit('message:read', readPayload);
        } else if (chatId) {
          io.emit('message:read', readPayload);
        }
      }
    } catch (err) {
      console.error('Error handling message:read:', err);
    }
  });

  // New Random Chat Events (matching new client implementation)
  
  // Start searching for a random chat match
  socket.on("random-chat:search", async (data) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      const { mode, interests, ageRange, languages, userId } = data; // mode: 'text' | 'audio' | 'video'
      
      // Use userId from data (logged-in user) or socket.userId (anonymous)
      const effectiveUserId = userId || socket.userId || socket.id;
      
      // Generate unique anonymous ID for this session
      const anonymousId = socket.anonymousId || `User${Math.random().toString(36).substr(2, 4)}`;
      socket.anonymousId = anonymousId;
      socket.userId = effectiveUserId; // Ensure socket.userId is set
      
      console.log(`User ${effectiveUserId} (${anonymousId}) searching for ${mode} chat`);

      // Store mode on socket for matching
      socket.chatMode = mode;

      // Fetch user data from database for better matching (skip for truly anonymous)
      let userDbData = null;
      if (userId) {
        try {
          const mongoose = require('mongoose');
          const dbConnect = require('./src/lib/mongoose').default;
          const User = require('./src/models/User').default;
          
          await dbConnect();
          userDbData = await User.findById(userId)
            .select('interests ageRange preferredLanguages username')
            .lean();
          
          // Update user interests if provided
          if (interests && interests.length > 0) {
            await User.findByIdAndUpdate(userId, {
              interests,
              ...(ageRange && { ageRange }),
              ...(languages && { preferredLanguages: languages })
            });
            userDbData = { ...userDbData, interests, ageRange, preferredLanguages: languages };
          }
        } catch (dbError) {
          console.log('Could not fetch/update user data:', dbError.message);
        }
      }

      // Add to mode-specific queue with user data
      randomChatQueue.set(effectiveUserId, {
        socket,
        mode,
        userId: effectiveUserId,
        anonymousId: anonymousId,
        username: userDbData?.username || anonymousId,
        joinTime: Date.now(),
        userDbData
      });

      console.log(`Queue size for ${mode}: ${Array.from(randomChatQueue.values()).filter(u => u.mode === mode).length}`);

      // Try to find a match immediately
      const matched = await tryMatchUsersByMode(mode, effectiveUserId);
      
      if (!matched) {
        console.log(`No match found for user ${effectiveUserId}, remaining in queue (total queue: ${randomChatQueue.size})`);
        // Client will handle 15s timeout and fall back to AI bot
      }
    } catch (error) {
      console.error("Error in random-chat:search:", error);
      socket.emit("error", { message: "Failed to search for chat" });
    }
  });

  // Send a message in the current session
  socket.on("random-chat:message", async (data) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      const { sessionId, message } = data;
      
      if (!sessionId || !message) {
        socket.emit("error", { message: "Invalid message data" });
        return;
      }

      console.log(`Message in session ${sessionId} from ${socket.userId}`);

      const session = activeSessions.get(sessionId);
      if (!session) {
        socket.emit("error", { message: "Session not found" });
        return;
      }

      // Determine sender's anonymous ID
      let senderAnonymousId;
      let isUser1 = false;
      if (session.user1.userId === socket.userId) {
        senderAnonymousId = session.user1.anonymousId;
        isUser1 = true;
      } else if (session.user2.userId === socket.userId) {
        senderAnonymousId = session.user2.anonymousId;
        isUser1 = false;
      } else {
        socket.emit("error", { message: "User not in session" });
        return;
      }

      // Broadcast message to partner
      const messageData = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: message,
        sender: senderAnonymousId,
        timestamp: new Date().toISOString(),
        isOwn: false
      };

      socket.to(`session-${sessionId}`).emit("random-chat:message", messageData);

      // Increment message count
      session.messagesCount = (session.messagesCount || 0) + 1;

      // Try to persist to database (optional, fail silently)
      try {
        const mongoose = require('mongoose');
        const dbConnect = require('./src/lib/mongoose').default;
        const RandomChatSession = require('./src/models/RandomChatSession').default;

        await dbConnect();
        
        const dbSession = await RandomChatSession.findOne({
          sessionId,
          status: 'active'
        });

        if (dbSession) {
          let userObjectId;
          if (typeof socket.userId === 'string') {
            userObjectId = new mongoose.Types.ObjectId(socket.userId);
          } else {
            userObjectId = socket.userId;
          }

          await dbSession.addMessage(
            userObjectId,
            senderAnonymousId,
            message,
            'text'
          );
        }
      } catch (dbError) {
        console.error("Error persisting message:", dbError);
      }
    } catch (error) {
      console.error("Error in random-chat:message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Disconnect from current session
  socket.on("random-chat:disconnect", async (data) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      const { sessionId } = data;
      
      if (!sessionId) {
        socket.emit("error", { message: "Invalid session ID" });
        return;
      }

      console.log(`User ${socket.userId} disconnecting from session ${sessionId}`);

      const session = activeSessions.get(sessionId);
      if (session) {
        // Notify partner
        const partnerSocket = session.user1.userId === socket.userId 
          ? session.user2.socket 
          : session.user1.socket;
        
        if (partnerSocket && partnerSocket.connected) {
          partnerSocket.emit("random-chat:partner-disconnected", {
            sessionId,
            timestamp: new Date().toISOString()
          });
          partnerSocket.leave(`session-${sessionId}`);
        }

        // Remove session
        activeSessions.delete(sessionId);
        
        // Leave room
        socket.leave(`session-${sessionId}`);
        
        console.log(`Session ${sessionId} ended`);
      }

      // Confirm disconnection to user
      socket.emit("random-chat:disconnected", { sessionId });
    } catch (error) {
      console.error("Error in random-chat:disconnect:", error);
      socket.emit("error", { message: "Failed to disconnect" });
    }
  });

  // Random Chat Events
  socket.on("random-chat:join-queue", async (preferences) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      // Use socket.userId for authenticated users or socket.anonymousId for anonymous
      const userIdentifier = socket.userId || socket.anonymousId || socket.id;
      const displayName = socket.username || socket.anonymousId || 'Anonymous';
      
      console.log(
        "User joining random chat queue:",
        userIdentifier,
        displayName,
        preferences,
        socket.isAnonymous ? '(anonymous)' : '(authenticated)'
      );

      // Assign an anonymousId if not already set (for display purposes)
      if (!socket.anonymousId) {
        socket.anonymousId = `User${Math.random().toString(36).substr(2, 4)}`;
      }

      // Add user to queue
      randomChatQueue.set(userIdentifier, {
        socket,
        preferences,
        joinTime: new Date().toISOString(),
        anonymousId: socket.anonymousId,
        username: displayName,
        isAnonymous: socket.isAnonymous || false
      });

      // Send queue position
      const queuePosition = Array.from(randomChatQueue.keys()).indexOf(userIdentifier) + 1;
      socket.emit("random-chat:queue-position", {
        position: queuePosition,
        estimatedWait: Math.max(30, queuePosition * 15),
      });

      // Try to match users
      setTimeout(() => tryMatchUsers(), 1000);
    } catch (error) {
      console.error("Error joining queue:", error);
      socket.emit("error", "Failed to join queue");
    }
  });

  socket.on("random-chat:leave-queue", async () => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      console.log("User leaving random chat queue:", socket.userId);
      randomChatQueue.delete(socket.userId);
      socket.emit("random-chat:queue-left");
    } catch (error) {
      console.error("Error leaving queue:", error);
      socket.emit("error", "Failed to leave queue");
    }
  });

  socket.on("random-chat:end-session", async (sessionId) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      console.log("User ending session:", socket.userId, sessionId);
      const session = activeSessions.get(sessionId);
      if (session) {
        // Notify other user first
        const otherSocket = session.user1.userId === socket.userId ? session.user2.socket : session.user1.socket;
        if (otherSocket && otherSocket.connected) {
          otherSocket.emit("random-chat:session-ended", { 
            sessionId, 
            reason: "partner_left",
            timestamp: new Date().toISOString()
          });
        }
        
        // Remove session
        activeSessions.delete(sessionId);
        
        // Leave socket rooms
        if (session.user1.socket && session.user1.socket.connected) {
          session.user1.socket.leave(`session-${sessionId}`);
        }
        if (session.user2.socket && session.user2.socket.connected) {
          session.user2.socket.leave(`session-${sessionId}`);
        }
      }
      
      // Confirm to the user who ended the session
      socket.emit("random-chat:session-ended", { 
        sessionId, 
        reason: "user_left",
        timestamp: new Date().toISOString()
      });
      socket.leave(`session-${sessionId}`);
      
    } catch (error) {
      console.error("Error ending session:", error);
      socket.emit("error", "Failed to end session");
    }
  });

  socket.on("random-chat:message-send", async (data) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      if (!data || !data.sessionId || !data.content) {
        socket.emit("error", "Invalid message data");
        return;
      }

      console.log("Random chat message:", data);

      // Try to persist message to database
      try {
        // Import mongoose and models here to avoid circular dependencies
        const mongoose = require('mongoose');
        const dbConnect = require('./src/lib/mongoose').default;
        const RandomChatSession = require('./src/models/RandomChatSession').default;
        const User = require('./src/models/User').default;

        // Connect to database
        await dbConnect();

        // Find the session and user
        const session = activeSessions.get(data.sessionId);
        if (session) {
          // Find which user is sending the message
          const sendingUser = session.user1.socket === socket ? session.user1 : session.user2;
          
          if (sendingUser && sendingUser.userId) {
            // Find the database session
            const dbSession = await RandomChatSession.findOne({
              sessionId: data.sessionId,
              status: 'active'
            });

            if (dbSession) {
              // Convert string userId to ObjectId if needed
              let userObjectId;
              if (typeof sendingUser.userId === 'string') {
                userObjectId = new mongoose.Types.ObjectId(sendingUser.userId);
              } else {
                userObjectId = sendingUser.userId;
              }

              // Add message to database
              await dbSession.addMessage(
                userObjectId,
                sendingUser.anonymousId,
                data.content,
                data.type || 'text'
              );

              console.log(`Message persisted to database for session ${data.sessionId}`);
            }
          }
        }
      } catch (dbError) {
        console.error("Error persisting message to database:", dbError);
        // Continue with socket broadcast even if DB save fails
      }

      // Broadcast to session participants
      socket
        .to(`session-${data.sessionId}`)
        .emit("random-chat:message-received", {
          messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sessionId: data.sessionId,
          anonymousId: socket.anonymousId || "Anonymous",
          content: data.content,
          timestamp: new Date().toISOString(),
          type: data.type || "text",
          isOwn: false,
        });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  socket.on("random-chat:join-session", (sessionId) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      if (!sessionId) {
        socket.emit("error", "Invalid session ID");
        return;
      }
      socket.join(`session-${sessionId}`);
      console.log(`User ${socket.userId} joined session ${sessionId}`);
      
      // Notify user of successful join
      socket.emit('random-chat:session-joined', {
        sessionId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', 'Failed to join session');
    }
  });

  socket.on("random-chat:typing-start", (sessionId) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      socket.to(`session-${sessionId}`).emit("random-chat:typing-start", {
        anonymousId: socket.anonymousId || "Anonymous"
      });
    } catch (error) {
      console.error("Error handling typing start:", error);
    }
  });

  socket.on("random-chat:typing-stop", (sessionId) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      socket.to(`session-${sessionId}`).emit("random-chat:typing-stop", {
        anonymousId: socket.anonymousId || "Anonymous"
      });
    } catch (error) {
      console.error("Error handling typing stop:", error);
    }
  });

  // WebRTC Events
  socket.on('random-chat:webrtc-offer', (data) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'WebRTC disabled' }); return; }
      socket.to(`session-${data.sessionId}`).emit('random-chat:webrtc-offer-received', data);
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  });

  socket.on('random-chat:webrtc-answer', (data) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'WebRTC disabled' }); return; }
      socket.to(`session-${data.sessionId}`).emit('random-chat:webrtc-answer-received', data);
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  });

  socket.on('random-chat:webrtc-ice-candidate', (data) => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'WebRTC disabled' }); return; }
      socket.to(`session-${data.sessionId}`).emit('random-chat:webrtc-ice-candidate-received', data);
    } catch (error) {
      console.error('Error handling WebRTC ICE candidate:', error);
    }
  });

  // Debug: respond with queue and active session sizes to help clients troubleshoot matching
  socket.on('random-chat:debug', () => {
    try {
      if (randomChatDisabled) { socket.emit('random-chat:unsupported', { message: 'Random chat disabled' }); return; }
      const queueSize = randomChatQueue.size;
      const activeSessionsCount = activeSessions.size;
      console.log(`Debug request from ${socket.id}: queueSize=${queueSize}, activeSessions=${activeSessionsCount}`);
      socket.emit('random-chat:debug-response', { queueSize, activeSessions: activeSessionsCount });
    } catch (err) {
      console.error('Error handling random-chat:debug:', err);
      socket.emit('random-chat:debug-response', { queueSize: 0, activeSessions: 0, error: String(err) });
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    // Remove from queue if present
    randomChatQueue.delete(socket.userId);
    
    // End any active sessions
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.user1.userId === socket.userId || session.user2.userId === socket.userId) {
        const otherSocket = session.user1.userId === socket.userId ? session.user2.socket : session.user1.socket;
        otherSocket.emit("random-chat:session-ended", { sessionId });
        activeSessions.delete(sessionId);
        break;
      }
    }
  });

  // ==================== BLUETOOTH SOCKET EVENTS ====================
  
  // Bluetooth: Notify when a user enables/disables Bluetooth
  socket.on('bluetooth:status-change', (data) => {
    try {
      const { userId, bluetoothEnabled } = data;
      console.log(`Bluetooth status changed for user ${userId}: ${bluetoothEnabled}`);
      
      // Broadcast to user's own devices (if multiple sessions)
      socket.to(`user-${userId}`).emit('bluetooth:status-updated', {
        userId,
        bluetoothEnabled,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling bluetooth:status-change:', error);
      socket.emit('error', 'Failed to update Bluetooth status');
    }
  });

  // Bluetooth: User detected nearby via Bluetooth scan
  socket.on('bluetooth:device-detected', (data) => {
    try {
      const { detectorId, detectedDeviceId } = data;
      console.log(`Bluetooth device detected by ${detectorId}: ${detectedDeviceId}`);
      
      // The API handles the actual detection and emits 'bluetoothNearby'
      // This event is for logging/debugging purposes
    } catch (error) {
      console.error('Error handling bluetooth:device-detected:', error);
    }
  });

  // Bluetooth: Request to connect with nearby user
  socket.on('bluetooth:request-connection', (data) => {
    try {
      const { senderId, receiverId, senderInfo } = data;
      console.log(`Bluetooth connection request from ${senderId} to ${receiverId}`);
      
      // Notify receiver of connection request
      socket.to(`user-${receiverId}`).emit('bluetooth:connection-request', {
        from: senderInfo,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling bluetooth:request-connection:', error);
      socket.emit('error', 'Failed to send connection request');
    }
  });

  // Bluetooth: Accept connection request
  socket.on('bluetooth:accept-connection', (data) => {
    try {
      const { senderId, receiverId, receiverInfo } = data;
      console.log(`Bluetooth connection accepted: ${receiverId} accepted ${senderId}`);
      
      // Notify sender that their request was accepted
      socket.to(`user-${senderId}`).emit('bluetooth:connection-accepted', {
        from: receiverInfo,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling bluetooth:accept-connection:', error);
      socket.emit('error', 'Failed to accept connection');
    }
  });

  // Bluetooth: Reject connection request
  socket.on('bluetooth:reject-connection', (data) => {
    try {
      const { senderId, receiverId } = data;
      console.log(`Bluetooth connection rejected: ${receiverId} rejected ${senderId}`);
      
      // Notify sender that their request was rejected
      socket.to(`user-${senderId}`).emit('bluetooth:connection-rejected', {
        receiverId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling bluetooth:reject-connection:', error);
      socket.emit('error', 'Failed to reject connection');
    }
  });

  // Bluetooth: Remove user from nearby list
  socket.on('bluetooth:remove-nearby', (data) => {
    try {
      const { userId, nearbyUserId } = data;
      console.log(`Removing ${nearbyUserId} from ${userId}'s nearby list`);
      
      // The API handles the actual removal
      // This event can trigger additional cleanup if needed
    } catch (error) {
      console.error('Error handling bluetooth:remove-nearby:', error);
      socket.emit('error', 'Failed to remove nearby user');
    }
  });

  // Bluetooth: Sync offline connections
  socket.on('bluetooth:sync-request', (data) => {
    try {
      const { userId, pendingCount } = data;
      console.log(`Bluetooth sync requested for user ${userId} with ${pendingCount} pending connections`);
      
      // The API handles the actual sync
      // This event is for notification purposes
    } catch (error) {
      console.error('Error handling bluetooth:sync-request:', error);
      socket.emit('error', 'Failed to request sync');
    }
  });

  // ==================== END BLUETOOTH SOCKET EVENTS ====================

  // Health check event
  socket.on('health-check', () => {
    socket.emit('health-response', {
      status: 'healthy',
      socketServer: {
        port: SOCKET_PORT,
        path: '/socket.io/',
        totalConnections: connectionHealth.totalConnections,
        activeConnections: connectionHealth.activeConnections,
        errorCount: connectionHealth.errorCount,
        lastError: connectionHealth.lastError,
        uptime: Date.now() - connectionHealth.uptime
      },
      timestamp: new Date().toISOString()
    });
  });
});

// Random Chat Queue Management (outside socket connection)
const randomChatQueue = new Map(); // userId -> { socket, preferences, joinTime }
const activeSessions = new Map(); // sessionId -> { user1, user2, startTime }

// Helper function to generate session ID
function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to match users from queue
function tryMatchUsers() {
  // Dev toggle: disable matching entirely when env var set. Useful for testing
  // UI behavior when no match is found (keeps users in queue).
  if (process.env.RANDOM_CHAT_DISABLE_MATCH === '1') {
    console.log('Random chat matching disabled via RANDOM_CHAT_DISABLE_MATCH=1');
    return false;
  }
  const queueEntries = Array.from(randomChatQueue.entries());
  
  if (queueEntries.length < 2) return;
  
  console.log(`Trying to match users. Queue size: ${queueEntries.length}`);
  
  // Simple matching - take first two users with compatible preferences
  for (let i = 0; i < queueEntries.length - 1; i++) {
    for (let j = i + 1; j < queueEntries.length; j++) {
      const [userId1, user1] = queueEntries[i];
      const [userId2, user2] = queueEntries[j];
      
      // Check if preferences are compatible (default to 'text' if not specified)
      const chatType1 = user1.preferences?.chatType || 'text';
      const chatType2 = user2.preferences?.chatType || 'text';
      
      if (chatType1 === chatType2) {
        // Create session
        const sessionId = generateSessionId();
        const session = {
          sessionId,
          user1: {
            userId: userId1,
            socket: user1.socket,
            // Use the anonymousId already assigned (from queue entry)
            anonymousId: user1.anonymousId || `User${Math.random().toString(36).substr(2, 4)}`,
            username: user1.username || user1.anonymousId || 'Anonymous',
            isActive: true
          },
          user2: {
            userId: userId2,
            socket: user2.socket,
            anonymousId: user2.anonymousId || `User${Math.random().toString(36).substr(2, 4)}`,
            username: user2.username || user2.anonymousId || 'Anonymous',
            isActive: true
          },
          chatType: chatType1,
          startTime: new Date().toISOString(),
          messagesCount: 0
        };
        
        // Remove users from queue
        randomChatQueue.delete(userId1);
        randomChatQueue.delete(userId2);
        
        // Add to active sessions
        activeSessions.set(sessionId, session);
        
        // Join socket rooms
        user1.socket.join(`session-${sessionId}`);
        user2.socket.join(`session-${sessionId}`);
        
        // Notify both users of match
        const sessionData = {
          sessionId,
          chatType: session.chatType,
          startTime: session.startTime,
          messagesCount: 0
        };
        
        user1.socket.emit('random-chat:session-matched', {
          ...sessionData,
          partner: {
            anonymousId: session.user2.anonymousId,
            username: session.user2.username,
            isActive: session.user2.isActive
          }
        });
        
        user2.socket.emit('random-chat:session-matched', {
          ...sessionData,
          partner: {
            anonymousId: session.user1.anonymousId,
            username: session.user1.username,
            isActive: session.user1.isActive
          }
        });
        
        console.log(`✅ Matched users ${userId1} (${session.user1.username}) and ${userId2} (${session.user2.username}) in session ${sessionId}`);
        return; // Exit after first match
      }
    }
  }
}

// Calculate interest similarity score (0-1)
function calculateInterestScore(interests1, interests2) {
  if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
    return 0.5; // Neutral score if no interests
  }
  
  const set1 = new Set(interests1.map(i => i.toLowerCase()));
  const set2 = new Set(interests2.map(i => i.toLowerCase()));
  
  // Calculate Jaccard similarity
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Enhanced matching function with interest-based scoring
async function tryMatchUsersByMode(mode, requestingUserId) {
  // Dev toggle: disable matching entirely when env var set
  if (process.env.RANDOM_CHAT_DISABLE_MATCH === '1') {
    console.log(`tryMatchUsersByMode: matching disabled (mode=${mode})`);
    return false;
  }
  const queueEntries = Array.from(randomChatQueue.entries());
  
  console.log(`Trying to match by mode: ${mode}, Queue size: ${queueEntries.length}`);
  
  const requestingUser = randomChatQueue.get(requestingUserId);
  if (!requestingUser) return false;
  
  // Get user data from database for interest matching
  let requestingUserData = null;
  try {
    const mongoose = require('mongoose');
    const dbConnect = require('./src/lib/mongoose').default;
    const User = require('./src/models/User').default;
    
    await dbConnect();
    requestingUserData = await User.findById(requestingUserId).select('interests ageRange preferredLanguages').lean();
  } catch (error) {
    console.log('Could not fetch user data for matching, using basic matching');
  }
  
  // Find candidates and score them
  const candidates = [];
  
  for (const [userId, userData] of queueEntries) {
    if (userId === requestingUserId) continue; // Skip self
    if (userData.mode !== mode) continue; // Skip different modes
    
    // Calculate match score
    let score = 1.0; // Base score
    
    if (requestingUserData && userData.userDbData) {
      // Interest-based matching
      const interestScore = calculateInterestScore(
        requestingUserData.interests,
        userData.userDbData.interests
      );
      score *= (0.3 + interestScore * 0.7); // Weight interest matching 30-100%
      
      // Language preference
      const hasCommonLanguage = requestingUserData.preferredLanguages?.some(lang =>
        userData.userDbData.preferredLanguages?.includes(lang)
      );
      if (hasCommonLanguage) {
        score *= 1.2; // Boost score for common language
      }
    }
    
    // Prioritize users who have been waiting longer
    const waitTime = Date.now() - userData.joinTime;
    const waitScore = Math.min(1.5, 1 + (waitTime / 60000) * 0.1); // +10% per minute, max 150%
    score *= waitScore;
    
    candidates.push({ userId, userData, score });
  }
  
  if (candidates.length === 0) {
    console.log(`No match found for user ${requestingUserId} in ${mode} mode`);
    return false;
  }
  
  // Sort by score (best match first)
  candidates.sort((a, b) => b.score - a.score);
  
  // Match with best candidate
  const bestMatch = candidates[0];
  const user1 = requestingUser;
  const user2 = bestMatch.userData;
  
  console.log(`Best match for ${requestingUserId}: ${bestMatch.userId} (score: ${bestMatch.score.toFixed(2)})`);
  
  // Create session
  const sessionId = generateSessionId();
  const session = {
    sessionId,
    mode,
    user1: {
      userId: requestingUserId,
      socket: user1.socket,
      anonymousId: user1.anonymousId,
      username: user1.username || user1.anonymousId,
      isActive: true
    },
    user2: {
      userId: bestMatch.userId,
      socket: user2.socket,
      anonymousId: user2.anonymousId,
      username: user2.username || user2.anonymousId,
      isActive: true
    },
    startTime: Date.now(),
    messagesCount: 0,
    matchScore: bestMatch.score
  };
  
  // Remove both users from queue
  randomChatQueue.delete(requestingUserId);
  randomChatQueue.delete(bestMatch.userId);
  
  // Add to active sessions
  activeSessions.set(sessionId, session);
  
  // Join socket rooms
  user1.socket.join(`session-${sessionId}`);
  user2.socket.join(`session-${sessionId}`);
  
  // Store session ID on sockets
  user1.socket.currentSessionId = sessionId;
  user2.socket.currentSessionId = sessionId;
  
  // Notify both users of match (use session-matched event)
  user1.socket.emit('random-chat:session-matched', {
    sessionId,
    chatType: mode,
    mode: mode,
    startTime: session.startTime,
    messagesCount: 0,
    partner: {
      anonymousId: session.user2.anonymousId,
      username: session.user2.username,
      isActive: session.user2.isActive
    }
  });
  
  user2.socket.emit('random-chat:session-matched', {
    sessionId,
    chatType: mode,
    mode: mode,
    startTime: session.startTime,
    messagesCount: 0,
    partner: {
      anonymousId: session.user1.anonymousId,
      username: session.user1.username,
      isActive: session.user1.isActive
    }
  });
  
  console.log(`✅ Matched ${requestingUserId} (${session.user1.username}) with ${bestMatch.userId} (${session.user2.username}) in ${mode} mode, session: ${sessionId}`);
  return true; // Match found
}

// Start Socket.IO server with enhanced error handling
socketServer.listen(SOCKET_PORT, (err) => {
  if (err) {
    console.error(`Failed to start Socket.IO server on port ${SOCKET_PORT}:`, err);
    process.exit(1);
  }
  console.log(`✅ Socket.IO server running on port ${SOCKET_PORT}`);
  console.log(`📊 Socket.IO ready for connections`);
});

// Create a simple HTTP health server on a different port
const healthPort = parseInt(SOCKET_PORT) + 1;
const healthServer = createServer((req, res) => {
  // Helper to respond safely and log stack traces when a write is attempted after end
  function safeRespond(statusCode, bodyObj, headers = {}) {
    if (res.writableEnded) {
      console.error('Attempted to write response after it was ended (ERR_HTTP_HEADERS_SENT). Stack:');
      console.error(new Error().stack);
      return false;
    }
    try {
      res.writeHead(statusCode, Object.assign({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, headers));
      res.end(JSON.stringify(bodyObj));
      return true;
    } catch (err) {
      console.error('Error while writing response in safeRespond:', err);
      try { if (!res.writableEnded) res.end(); } catch (e) { /* ignore */ }
      return false;
    }
  }
  // Basic health endpoint
  if (req.url === '/health' && req.method === 'GET') {
    safeRespond(200, {
      status: 'healthy',
      socketServer: {
        port: SOCKET_PORT,
        path: '/socket.io/',
        totalConnections: connectionHealth.totalConnections,
        activeConnections: connectionHealth.activeConnections,
        errorCount: connectionHealth.errorCount,
        lastError: connectionHealth.lastError,
        uptime: Date.now() - connectionHealth.uptime
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Simple emit bridge: accept POST /emit with JSON { type: string, data: any }
  if (req.url === '/emit' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { type, data } = payload;
        if (type && typeof type === 'string') {
          // If a targetUserId is provided, emit only to that user's room
          if (payload.targetUserId) {
            try {
              // Support both room naming conventions used in this project
              const target = payload.targetUserId;
              io.to(`user:${target}`).emit(type, data);
              io.to(`user-${target}`).emit(type, data);
              safeRespond(200, { ok: true, emitted: type, target });
              return;
            } catch (emitErr) {
              console.error('Error emitting to target user room:', emitErr);
              safeRespond(500, { error: 'Failed to emit to target user' });
              return;
            }
          } else {
            // Re-emit to all connected clients
            try {
              io.emit(type, data);
              safeRespond(200, { ok: true, emitted: type });
              return;
            } catch (emitErr) {
              console.error('Error emitting to all clients:', emitErr);
              safeRespond(500, { error: 'Failed to emit to clients' });
              return;
            }
          }
        } else {
          safeRespond(400, { error: 'Invalid payload: missing type' });
          return;
        }
      } catch (err) {
        console.error('Invalid JSON in /emit:', err && err.message);
        safeRespond(400, { error: 'Invalid JSON' });
        return;
      }
    });
    return;
  }

  // Fallback 404 for any other paths
  res.writeHead(404);
  res.end('Not Found');
});

healthServer.listen(healthPort, () => {
  console.log(`🏥 Health endpoint: http://localhost:${healthPort}/health`);
});

socketServer.on('error', (error) => {
  console.error('Socket.IO server error:', error);
  connectionHealth.errorCount++;
  connectionHealth.lastError = {
    timestamp: new Date().toISOString(),
    error: error.message,
    code: error.code
  };
});
