require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const Message = require('./models/Message');
const { verifyToken } = require('./utils/jwt');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FriendFinder API is running' });
});

// Socket.IO connection handling
const userSockets = new Map(); // Map userId to socketId

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Authenticate user
  socket.on('authenticate', async (token) => {
    try {
      const decoded = verifyToken(token);
      if (decoded) {
        socket.userId = decoded.id;
        userSockets.set(decoded.id, socket.id);
        
        // Update user online status
        await User.findByIdAndUpdate(decoded.id, {
          isOnline: true,
          lastSeen: Date.now(),
        });

        socket.emit('authenticated', { userId: decoded.id });
        
        // Notify friends
        const user = await User.findById(decoded.id).populate('friends');
        user.friends.forEach(friend => {
          const friendSocketId = userSockets.get(friend._id.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('friend-online', { userId: decoded.id });
          }
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  });

  // Handle chat messages
  socket.on('send-message', async (data) => {
    try {
      const { receiverId, content } = data;

      const message = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content,
      });

      await message.populate('sender receiver', 'name avatar');

      // Send to receiver if online
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive-message', message);
      }

      // Send confirmation to sender
      socket.emit('message-sent', message);
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { receiverId } = data;
    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', { userId: socket.userId });
    }
  });

  socket.on('stop-typing', (data) => {
    const { receiverId } = data;
    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-stop-typing', { userId: socket.userId });
    }
  });

  // WebRTC signaling for video/audio calls
  socket.on('call-user', (data) => {
    const { to, signal, from } = data;
    const toSocketId = userSockets.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('incoming-call', { signal, from });
    }
  });

  socket.on('accept-call', (data) => {
    const { to, signal } = data;
    const toSocketId = userSockets.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('call-accepted', { signal });
    }
  });

  socket.on('reject-call', (data) => {
    const { to } = data;
    const toSocketId = userSockets.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('call-rejected');
    }
  });

  socket.on('end-call', (data) => {
    const { to } = data;
    const toSocketId = userSockets.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('call-ended');
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.userId) {
      userSockets.delete(socket.userId);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: Date.now(),
      });

      // Notify friends
      try {
        const user = await User.findById(socket.userId).populate('friends');
        if (user) {
          user.friends.forEach(friend => {
            const friendSocketId = userSockets.get(friend._id.toString());
            if (friendSocketId) {
              io.to(friendSocketId).emit('friend-offline', { userId: socket.userId });
            }
          });
        }
      } catch (error) {
        console.error('Error notifying friends:', error);
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
