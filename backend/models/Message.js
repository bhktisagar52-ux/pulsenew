const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'story_reply'],
    default: 'text'
  },
  storyReply: {
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story'
    },
    storyThumbnail: String,
    storyAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying of messages in a conversation
messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
