const { createServer } = require("http");
const { Server } = require("socket.io");

const SOCKET_PORT = process.env.PORT || process.env.SOCKET_PORT || 3004;

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

// Initialize Socket.IO with enhanced configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// Allow configuring allowed client origins via environment variable. Use a
// comma-separated list in `SOCKET_ALLOWED_ORIGINS` or `NEXT_PUBLIC_CLIENT_ORIGINS`.
const envOriginsRaw = process.env.SOCKET_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_CLIENT_ORIGINS || '';
const envOrigins = envOriginsRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Keep the project's historical production origins but include the new
// friendfinder-vscode domain so deployed frontends can connect by default.
const defaultProdOrigins = [
  'https://friendfinder-0i02.onrender.com',
  process.env.NEXTAUTH_URL,
  'https://friendfinder-vscode.onrender.com'
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

const io = new Server(socketServer, {
  path: "/socket.io/",
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Allow both transports; clients will start with polling and upgrade to websocket
  transports: ["polling", "websocket"],
  allowEIO3: true,
  // Increase upgrade timeout for slower connections (Render free tier can be slow)
  upgradeTimeout: 30000,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 20000,
  maxHttpBufferSize: 1e6,
  // Explicitly allow upgrades
  allowUpgrades: true,
  perMessageDeflate: false, // Disable compression to reduce upgrade handshake issues
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const isAllowed = !origin || allowedOrigins.some(allowed => 
      origin === allowed || (isDevelopment && origin.includes('localhost'))
    );
    console.log(`Socket.IO connection request from ${origin}: ${isAllowed ? 'ALLOWED' : 'DENIED'}`);
    callback(null, isAllowed);
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
      socket.userId = userData.userId;
      socket.username = userData.username;
      socket.join(`user-${userData.userId}`);
      console.log(`User registered: ${userData.username} (${userData.userId})`);
      
      // Send connection confirmation
      socket.emit('connection-confirmed', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        userId: userData.userId
      });
    } catch (error) {
      console.error('Error in user-register:', error);
      socket.emit('error', 'Failed to register user');
    }
  });

  // New Random Chat Events (matching new client implementation)
  
  // Start searching for a random chat match
  socket.on("random-chat:search", async (data) => {
    try {
      const { mode, interests, ageRange, languages } = data; // mode: 'text' | 'audio' | 'video'
      console.log(`User ${socket.userId} searching for ${mode} chat`);

      // Store mode on socket for matching
      socket.chatMode = mode;
      socket.anonymousId = `User${Math.random().toString(36).substr(2, 4)}`;

      // Fetch user data from database for better matching
      let userDbData = null;
      try {
        const mongoose = require('mongoose');
        const dbConnect = require('./src/lib/mongoose').default;
        const User = require('./src/models/User').default;
        
        await dbConnect();
        userDbData = await User.findById(socket.userId)
          .select('interests ageRange preferredLanguages')
          .lean();
        
        // Update user interests if provided
        if (interests && interests.length > 0) {
          await User.findByIdAndUpdate(socket.userId, {
            interests,
            ...(ageRange && { ageRange }),
            ...(languages && { preferredLanguages: languages })
          });
          userDbData = { interests, ageRange, preferredLanguages: languages };
        }
      } catch (dbError) {
        console.log('Could not fetch/update user data:', dbError.message);
      }

      // Add to mode-specific queue with user data
      randomChatQueue.set(socket.userId, {
        socket,
        mode,
        userId: socket.userId,
        anonymousId: socket.anonymousId,
        joinTime: Date.now(),
        userDbData
      });

      // Try to find a match immediately
      const matched = await tryMatchUsersByMode(mode, socket.userId);
      
      if (!matched) {
        console.log(`No match found for user ${socket.userId}, remaining in queue`);
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
      console.log(
        "User joining random chat queue:",
        socket.userId,
        preferences
      );

      // Add user to queue
      randomChatQueue.set(socket.userId, {
        socket,
        preferences,
        joinTime: new Date().toISOString()
      });

      // Send queue position
      const queuePosition = Array.from(randomChatQueue.keys()).indexOf(socket.userId) + 1;
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
      socket.to(`session-${sessionId}`).emit("random-chat:typing-start", {
        anonymousId: socket.anonymousId || "Anonymous"
      });
    } catch (error) {
      console.error("Error handling typing start:", error);
    }
  });

  socket.on("random-chat:typing-stop", (sessionId) => {
    try {
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
      socket.to(`session-${data.sessionId}`).emit('random-chat:webrtc-offer-received', data);
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  });

  socket.on('random-chat:webrtc-answer', (data) => {
    try {
      socket.to(`session-${data.sessionId}`).emit('random-chat:webrtc-answer-received', data);
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  });

  socket.on('random-chat:webrtc-ice-candidate', (data) => {
    try {
      socket.to(`session-${data.sessionId}`).emit('random-chat:webrtc-ice-candidate-received', data);
    } catch (error) {
      console.error('Error handling WebRTC ICE candidate:', error);
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
  const queueEntries = Array.from(randomChatQueue.entries());
  
  if (queueEntries.length < 2) return;
  
  console.log(`Trying to match users. Queue size: ${queueEntries.length}`);
  
  // Simple matching - take first two users with compatible preferences
  for (let i = 0; i < queueEntries.length - 1; i++) {
    for (let j = i + 1; j < queueEntries.length; j++) {
      const [userId1, user1] = queueEntries[i];
      const [userId2, user2] = queueEntries[j];
      
      // Check if preferences are compatible
      if (user1.preferences.chatType === user2.preferences.chatType) {
        // Create session
        const sessionId = generateSessionId();
        const session = {
          sessionId,
          user1: {
            userId: userId1,
            socket: user1.socket,
            anonymousId: `User${Math.random().toString(36).substr(2, 4)}`,
            isActive: true
          },
          user2: {
            userId: userId2,
            socket: user2.socket,
            anonymousId: `User${Math.random().toString(36).substr(2, 4)}`,
            isActive: true
          },
          chatType: user1.preferences.chatType,
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
            isActive: session.user2.isActive
          }
        });
        
        user2.socket.emit('random-chat:session-matched', {
          ...sessionData,
          partner: {
            anonymousId: session.user1.anonymousId,
            isActive: session.user1.isActive
          }
        });
        
        console.log(`✅ Matched users ${userId1} and ${userId2} in session ${sessionId}`);
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
      isActive: true
    },
    user2: {
      userId: bestMatch.userId,
      socket: user2.socket,
      anonymousId: user2.anonymousId,
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
  
  // Notify both users of match
  const matchData = {
    sessionId,
    mode,
    partnerAnonymousId: user2.anonymousId,
    startTime: session.startTime
  };
  
  user1.socket.emit('random-chat:matched', matchData);
  
  user2.socket.emit('random-chat:matched', {
    ...matchData,
    partnerAnonymousId: user1.anonymousId
  });
  
  console.log(`✅ Matched ${requestingUserId} with ${bestMatch.userId} in ${mode} mode, session: ${sessionId}`);
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
  // Basic health endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
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
    }));
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
              const target = payload.targetUserId
              io.to(`user:${target}`).emit(type, data)
              io.to(`user-${target}`).emit(type, data)
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              })
              res.end(JSON.stringify({ ok: true, emitted: type, target }))
            } catch (emitErr) {
              console.error('Error emitting to target user room:', emitErr)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Failed to emit to target user' }))
            }
          } else {
            // Re-emit to all connected clients
            io.emit(type, data);
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ ok: true, emitted: type }));
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid payload: missing type' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
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