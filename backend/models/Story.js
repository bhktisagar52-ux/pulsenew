const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    maxlength: 2200
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    index: { expires: 0 } // TTL index
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
storySchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
