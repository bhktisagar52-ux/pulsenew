require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// ======================
// Load models
// ======================
require('./models/User');
require('./models/Post');
require('./models/Comment');
require('./models/Story');
require('./models/Conversation');
require('./models/Message');
require('./models/Notification');

const app = express();
const server = http.createServer(app);

// ======================
// BASE URL (IMPORTANT)
// ======================
const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.BACKEND_URL || 'https://pulsenew-l909.onrender.com'
    : 'http://localhost:5000';

// Make BASE_URL available everywhere
app.set('BASE_URL', BASE_URL);

// ======================
// Socket.io
// ======================
const io = socketIo(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || '*'
        : '*',
    methods: ['GET', 'POST'],
  },
});

// ======================
// Middleware
// ======================
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || '*'
        : '*',
    credentials: true,
  })
);

app.use(express.json());

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================
// MongoDB
// ======================
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_social', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ======================
// Socket.io logic
// ======================
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, senderId, content } = data;
      const Conversation = mongoose.model('Conversation');

      const conversation = await Conversation.findById(conversationId).populate(
        'participants'
      );

      if (!conversation) return;

      conversation.participants.forEach((participant) => {
        if (participant._id.toString() !== senderId) {
          socket.to(participant._id.toString()).emit('newMessage', {
            conversationId,
            message: {
              sender: { _id: senderId },
              content,
              createdAt: new Date(),
            },
          });
        }
      });

      socket.emit('messageSent', { conversationId });
    } catch (error) {
      console.error('Socket sendMessage error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ======================
// Routes
// ======================
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const postRoutes = require('./routes/posts');
const storyRoutes = require('./routes/stories');
const notificationRoutes = require('./routes/notifications');

chatRoutes.setIo && chatRoutes.setIo(io);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notifications', notificationRoutes);

// ======================
// Health check
// ======================
app.get('/', (req, res) => {
  res.json({
    message: 'Pulse MERN Backend API',
    baseUrl: BASE_URL,
    status: 'OK',
  });
});

// ======================
// Start server
// ======================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Base URL: ${BASE_URL}`);
});
