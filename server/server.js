const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const Message = require('./models/Message');
const Chat = require('./models/Chat');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Real-Time Chat Application API',
    version: '1.0.0',
  });
});

// Socket.IO connection handling
const connectedUsers = new Map(); // userId -> socketId

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    // Verify token (simplified - in production use proper JWT verification)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Store user connection
  connectedUsers.set(socket.userId, socket.id);

  // Update user online status
  await User.findByIdAndUpdate(socket.userId, {
    isOnline: true,
    lastSeen: new Date(),
  });

  // Join user's personal room
  socket.join(socket.userId);

  // Notify others that user is online
  socket.broadcast.emit('user-online', { userId: socket.userId });

  // Join chat room
  socket.on('join-chat', async (chatId) => {
    try {
      // Convert chatId to string
      const chatIdStr = chatId.toString();
      
      // Verify user is part of the chat
      const chat = await Chat.findOne({
        _id: chatIdStr,
        users: { $elemMatch: { $eq: socket.userId } },
      });

      if (chat) {
        socket.join(chatIdStr);
        console.log(`User ${socket.userId} joined chat ${chatIdStr}`);
      } else {
        console.error(`Chat not found or access denied: ${chatIdStr} for user ${socket.userId}`);
        socket.emit('error', { message: 'Chat not found or access denied' });
      }
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  // Handle new message
  socket.on('new-message', async (data) => {
    try {
      const { chatId, content } = data;

      // Validate input
      if (!chatId || !content || !content.trim()) {
        socket.emit('error', { message: 'Chat ID and message content are required' });
        return;
      }

      // Verify user is part of the chat
      const chat = await Chat.findOne({
        _id: chatId,
        users: { $elemMatch: { $eq: socket.userId } },
      });

      if (!chat) {
        socket.emit('error', { message: 'Chat not found or access denied' });
        return;
      }

      // Create message in database
      const message = await Message.create({
        sender: socket.userId,
        content: content.trim(),
        chat: chatId,
        readBy: [socket.userId],
      });

      // Populate sender
      await message.populate('sender', 'name avatar');

      // Update chat's latest message
      await Chat.findByIdAndUpdate(chatId, {
        latestMessage: message._id,
      });

      // Convert chatId to string for room name
      const chatRoomId = chatId.toString();

      // Broadcast message to all users in the chat room (including sender)
      io.to(chatRoomId).emit('message-received', {
        message,
        chatId: chatRoomId,
      });

      console.log(`Message broadcasted to chat room: ${chatRoomId}`);
    } catch (error) {
      console.error('Error handling new message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { chatId, isTyping } = data;
    socket.to(chatId).emit('typing', {
      userId: socket.userId,
      isTyping,
      chatId,
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.userId}`);
    
    // Remove user connection
    connectedUsers.delete(socket.userId);

    // Update user offline status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      lastSeen: new Date(),
    });

    // Notify others that user is offline
    socket.broadcast.emit('user-offline', { userId: socket.userId });
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
