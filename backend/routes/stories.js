const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Story = require('../models/Story');
const { upload } = require('../config/cloudinary');

// Middleware to verify JWT token
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

// Get all stories (from users with mutual following + their own)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const User = mongoose.model('User');

    // Get current user's following and followers
    const currentUser = await User.findById(req.user.id).select('following followers');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find mutual follows (users that both follow each other)
    const mutualFollows = currentUser.following.filter(followingId =>
      currentUser.followers.some(followerId => followerId.toString() === followingId.toString())
    );

    // Include current user's own stories
    const allowedAuthors = [...mutualFollows, req.user.id];

    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
      author: { $in: allowedAuthors }
    })
      .populate('author', 'username profilePicture')
      .populate('views.user', 'username profilePicture')
      .populate('reactions.user', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stories by user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const stories = await Story.find({ author: req.params.userId, expiresAt: { $gt: new Date() } })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a story
router.post('/', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const { mediaType, caption } = req.body;
    const mediaUrl = req.file ? req.file.path : '';
    const story = new Story({
      author: req.user.id,
      mediaType,
      mediaUrl,
      caption
    });
    await story.save();
    await story.populate('author', 'username profilePicture');
    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// View a story
router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if already viewed
    const alreadyViewed = story.views.some(view => view.user.toString() === req.user.id);
    if (!alreadyViewed) {
      story.views.push({ user: req.user.id });
      await story.save();
    }

    res.json({ message: 'Story viewed' });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// React to a story
router.post('/:id/react', authenticateToken, async (req, res) => {
  try {
    const { emoji } = req.body;
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Remove existing reaction from this user
    story.reactions = story.reactions.filter(reaction => reaction.user.toString() !== req.user.id);

    // Add new reaction
    story.reactions.push({
      user: req.user.id,
      emoji: emoji
    });

    await story.save();
    res.json({ message: 'Reaction added' });
  } catch (error) {
    console.error('React to story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reply to a story (sends message to chat)
router.post('/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const story = await Story.findById(req.params.id).populate('author', 'username profilePicture');
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Don't allow replying to own story
    if (story.author._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot reply to your own story' });
    }

    // Check if mutual following exists
    const User = mongoose.model('User');
    const currentUser = await User.findById(req.user.id).select('following followers');
    const storyAuthor = await User.findById(story.author._id).select('following followers');

    if (!currentUser || !storyAuthor) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if they mutually follow each other
    const currentUserFollowsAuthor = currentUser.following.some(id => id.toString() === story.author._id.toString());
    const authorFollowsCurrentUser = storyAuthor.following.some(id => id.toString() === req.user.id);

    if (!currentUserFollowsAuthor || !authorFollowsCurrentUser) {
      return res.status(403).json({ message: 'You can only reply to stories from mutual follows' });
    }

    const Conversation = mongoose.model('Conversation');
    const Message = mongoose.model('Message');

    // Find or create conversation between story author and replier
    let conversation = await Conversation.findOne({
      participants: { $all: [story.author._id, req.user.id], $size: 2 }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [story.author._id, req.user.id]
      });
      await conversation.save();
    }

    // Create story thumbnail (use mediaUrl or create a small version)
    const storyThumbnail = story.mediaType === 'image' ? story.mediaUrl : story.mediaUrl; // For now, use full URL

    // Create the message with story reply
    const message = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: content,
      messageType: 'story_reply',
      storyReply: {
        storyId: story._id,
        storyThumbnail: storyThumbnail,
        storyAuthor: story.author._id
      }
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit socket event for real-time chat
    const io = req.app.get('io');
    if (io) {
      io.to(story.author._id.toString()).emit('newMessage', {
        conversationId: conversation._id,
        message: {
          _id: message._id,
          sender: { _id: req.user.id },
          content: content,
          messageType: 'story_reply',
          storyReply: {
            storyId: story._id,
            storyThumbnail: storyThumbnail,
            storyAuthor: story.author._id
          },
          createdAt: message.createdAt
        }
      });
    }

    res.json({ message: 'Reply sent to chat' });
  } catch (error) {
    console.error('Reply to story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a story (only by author)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
