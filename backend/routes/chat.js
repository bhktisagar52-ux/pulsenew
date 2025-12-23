const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Get io instance from main server
let io;
const setIo = (socketIo) => {
  io = socketIo;
};

// Middleware to verify JWT token (assuming it's defined in main server.js)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing' });

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .populate('participants', 'username profilePicture')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username'
      }
    })
    .sort({ lastMessageAt: -1 });

    // Add unread count to each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user.id }, // Messages not sent by current user
          'readBy.user': { $ne: req.user.id } // Messages not read by current user
        });

        return {
          ...conversation.toObject(),
          unreadCount
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread messages count (by conversations/people)
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    });

    let unreadCount = 0;

    for (const conversation of conversations) {
      const unreadMessages = await Message.countDocuments({
        conversation: conversation._id,
        sender: { $ne: req.user.id }, // Messages not sent by current user
        'readBy.user': { $ne: req.user.id } // Messages not read by current user
      });

      if (unreadMessages > 0) {
        unreadCount += 1; // Count conversations with unread messages
      }
    }

    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all messages in a conversation as read
router.put('/conversations/:id/mark-read', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Mark all unread messages in this conversation as read by current user
    await Message.updateMany(
      {
        conversation: req.params.id,
        sender: { $ne: req.user.id }, // Messages not sent by current user
        'readBy.user': { $ne: req.user.id } // Messages not read by current user
      },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get or create conversation between two users
router.post('/conversations/get-or-create', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = req.user.id;

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId], $size: 2 }
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [currentUserId, otherUserId]
      });
      await conversation.save();
    }

    // Populate participants
    await conversation.populate('participants', 'username profilePicture');
    await conversation.populate('lastMessage');

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'username profilePicture')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find the other participant
    const otherParticipantId = conversation.participants.find(id => id.toString() !== req.user.id);

    // Check privacy settings of the other user
    const otherUser = await require('../models/User').findById(otherParticipantId).select('privacySettings');
    if (otherUser) {
      const privacySettings = otherUser.privacySettings || {};
      const allowMessagesFrom = privacySettings.allowMessagesFrom || 'everyone';

      if (allowMessagesFrom === 'none') {
        return res.status(403).json({ message: 'This user does not accept messages' });
      }

      if (allowMessagesFrom === 'following') {
        // Check if current user follows the other user
        const currentUser = await require('../models/User').findById(req.user.id).select('following');
        if (!currentUser.following.includes(otherParticipantId)) {
          return res.status(403).json({ message: 'This user only accepts messages from people they follow' });
        }
      }
    }

    const message = new Message({
      conversation: req.params.id,
      sender: req.user.id,
      content
    });

    await message.save();
    await message.populate('sender', 'username profilePicture');

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit real-time message to all participants except sender
    if (io) {
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== req.user.id) {
          io.to(participantId.toString()).emit('newMessage', {
            conversationId: req.params.id,
            message: {
              _id: message._id,
              sender: message.sender,
              content: message.content,
              createdAt: message.createdAt
            }
          });
        }
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.setIo = setIo;
