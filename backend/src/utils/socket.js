const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Update user status to online and save socket ID
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date(),
    });

    // Notify friends that user is online
    const user = await User.findById(socket.userId).populate('friends');
    user.friends.forEach((friend) => {
      if (friend.socketId) {
        io.to(friend.socketId).emit('friend_online', {
          userId: socket.userId,
          name: user.name,
        });
      }
    });

    // Join personal room
    socket.join(socket.userId);

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content } = data;

        // Save message to database
        const message = new Message({
          sender: socket.userId,
          receiver: receiverId,
          content,
        });

        await message.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture');

        // Send to receiver if online
        const receiver = await User.findById(receiverId);
        if (receiver.socketId) {
          io.to(receiver.socketId).emit('receive_message', populatedMessage);
        }

        // Send confirmation to sender
        socket.emit('message_sent', populatedMessage);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { receiverId } = data;
      io.to(receiverId).emit('user_typing', {
        userId: socket.userId,
        name: socket.user.name,
      });
    });

    socket.on('stop_typing', (data) => {
      const { receiverId } = data;
      io.to(receiverId).emit('user_stop_typing', {
        userId: socket.userId,
      });
    });

    // WebRTC signaling for audio/video calls
    socket.on('call_user', async (data) => {
      try {
        const { userToCall, signalData, from, name, callType } = data;
        
        // Validate that caller is friends with the user they want to call
        const caller = await User.findById(socket.userId);
        if (!caller.friends.includes(userToCall)) {
          socket.emit('call_error', { error: 'Can only call friends' });
          return;
        }
        
        io.to(userToCall).emit('incoming_call', {
          signal: signalData,
          from,
          name,
          callType,
        });
      } catch (error) {
        console.error('Call user error:', error);
        socket.emit('call_error', { error: 'Failed to initiate call' });
      }
    });

    socket.on('answer_call', (data) => {
      const { to, signal } = data;
      io.to(to).emit('call_accepted', {
        signal,
        from: socket.userId,
      });
    });

    socket.on('reject_call', (data) => {
      const { to } = data;
      io.to(to).emit('call_rejected', {
        from: socket.userId,
      });
    });

    socket.on('end_call', (data) => {
      const { to } = data;
      io.to(to).emit('call_ended', {
        from: socket.userId,
      });
    });

    // Random call matching
    socket.on('find_random_match', async (data) => {
      const { callType } = data; // 'audio' or 'video'
      
      // Find available users for random calling (not implemented fully, placeholder)
      socket.emit('searching_for_match', { callType });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        socketId: '',
        lastSeen: new Date(),
      });

      // Notify friends that user is offline
      const user = await User.findById(socket.userId).populate('friends');
      if (user) {
        user.friends.forEach((friend) => {
          if (friend.socketId) {
            io.to(friend.socketId).emit('friend_offline', {
              userId: socket.userId,
              name: user.name,
            });
          }
        });
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
