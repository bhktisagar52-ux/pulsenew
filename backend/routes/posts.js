const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const multer = require('multer');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Removed duplicate authenticateToken middleware - using imported auth middleware instead

// Get all posts
router.get('/', auth, async (req, res) => {
  try {
    const { author, postType } = req.query;
    let query = {};
    if (author) query.author = author;
    if (postType) query.postType = postType;

    let posts = await Post.find(query)
      .populate('author', 'username profilePicture privacySettings followers')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      })
      .sort({ createdAt: -1 });

    // Filter posts based on privacy settings
    const currentUserId = req.user.id;
    posts = posts.filter(post => {
      const author = post.author;
      // Skip posts with null author (orphaned posts)
      if (!author || !author._id) {
        return false;
      }
      // Always show user's own posts
      if (author._id.toString() === currentUserId) {
        return true;
      }

      if (!author.privacySettings || !author.privacySettings.isPrivate) {
        // Public account - show all posts
        return true;
      }

      // Private account - only show to followers
      return author.followers && author.followers.some(follower =>
        follower.toString() === currentUserId
      );
    });

    // Remove privacySettings from response
    const cleanPosts = posts.map(post => {
      const postObj = post.toObject();
      delete postObj.author.privacySettings;
      delete postObj.author.followers;
      return postObj;
    });

    res.json(cleanPosts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reels (posts with postType 'reel')
router.get('/reels', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get all reels first
    let reels = await Post.find({ postType: 'reel' })
      .populate('author', 'username profilePicture privacySettings followers')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      })
      .sort({ createdAt: -1 });

    // Filter reels based on privacy settings
    const currentUserId = req.user.id;
    reels = reels.filter(reel => {
      const author = reel.author;
      if (!author.privacySettings || !author.privacySettings.isPrivate) {
        // Public account - show all reels
        return true;
      }

      // Private account - only show to followers
      return author.followers && author.followers.some(follower =>
        follower.toString() === currentUserId
      );
    });

    // Apply pagination after filtering
    const paginatedReels = reels.slice(skip, skip + parseInt(limit));

    // Remove privacySettings from response
    const cleanReels = paginatedReels.map(reel => {
      const reelObj = reel.toObject();
      delete reelObj.author.privacySettings;
      delete reelObj.author.followers;
      return reelObj;
    });

    const hasMore = skip + paginatedReels.length < reels.length;

    res.json({
      reels: cleanReels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: reels.length,
        hasMore
      }
    });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search posts
router.get('/search', auth, async (req, res) => {
  try {
    const { query, type } = req.query;
    console.log('Search posts request:', { query, type, user: req.user.id });
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let searchQuery = {};

    if (type === 'reel') {
      searchQuery = {
        postType: 'reel',
        $or: [
          { content: { $regex: query, $options: 'i' } }
        ]
      };
    } else {
      searchQuery = {
        $or: [
          { content: { $regex: query, $options: 'i' } }
        ]
      };
    }

    console.log('MongoDB search query:', searchQuery);
    const posts = await Post.find(searchQuery)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      })
      .sort({ createdAt: -1 })
      .limit(50); // Limit results for performance

    console.log('Search results found:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get saved posts for the current user
router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedPosts',
      populate: {
        path: 'author',
        select: 'username profilePicture'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.savedPosts);
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post or reel by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a post
// Create a post
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    const { content, postType } = req.body;
    const BASE_URL = req.app.get('BASE_URL');

    const image = req.file
      ? `${BASE_URL}/uploads/${req.file.filename}`
      : '';

    const post = new Post({
      author: req.user.id,
      content,
      image,
      postType: postType || 'post'
    });

    await post.save();
    await post.populate('author', 'username profilePicture');

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Like/Unlike a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);

      // Create notification if liking someone else's post
      if (post.author.toString() !== userId) {
        console.log('Creating like notification for post author:', post.author, 'from user:', userId);
        try {
          const liker = await User.findById(userId);
          if (!liker) {
            console.log('Liker user not found:', userId);
            // Don't return error here, just skip notification creation
          } else {
            const notification = new Notification({
              user: post.author,
              type: 'like',
              fromUser: userId,
              postId: post._id,
              message: `${liker.username} liked your post`
            });
            await notification.save();
            console.log('Like notification created successfully with ID:', notification._id);
          }
        } catch (notificationError) {
          console.error('Error creating like notification:', notificationError);
        }
      } else {
        console.log('No like notification created - user liked their own post');
      }
    }

    await post.save();
    res.json({ likes: post.likes.length, isLiked: !isLiked });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const commentData = {
      content,
      author: req.user.id,
      post: req.params.id,
    };

    if (parentComment) {
      commentData.parentComment = parentComment;
    }

    const comment = new Comment(commentData);
    await comment.save();
    await comment.populate('author', 'username profilePicture');

    post.comments.push(comment._id);
    await post.save();

    // Create notification if commenting on someone else's post
    if (post.author.toString() !== req.user.id) {
      try {
        const commenter = await User.findById(req.user.id);
        if (!commenter) {
          console.log('Commenter user not found:', req.user.id);
          // Don't return error here, just skip notification creation
        } else {
          const notification = new Notification({
            user: post.author,
            type: 'comment',
            fromUser: req.user.id,
            postId: post._id,
            message: `${commenter.username} commented on your post`
          });
          await notification.save();
          console.log('Comment notification created successfully with ID:', notification._id, 'for user:', post.author, 'from user:', req.user.id);
        }
      } catch (notificationError) {
        console.error('Error creating comment notification:', notificationError);
      }
    } else {
      console.log('No comment notification created - user commented on their own post');
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a post with nested replies
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Fetch all comments for the post
    const comments = await Comment.find({ post: postId })
      .populate('author', 'username profilePicture')
      .lean();

    // Build nested comment tree
    const commentMap = {};
    comments.forEach(comment => {
      comment.replies = [];
      commentMap[comment._id] = comment;
    });

    const rootComments = [];
    comments.forEach(comment => {
      if (comment.parentComment) {
        const parent = commentMap[comment.parentComment];
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    res.json(rootComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/Unsave a post
router.post('/:id/save', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    const isSaved = user.savedPosts.includes(req.params.id);

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== req.params.id);
    } else {
      user.savedPosts.push(req.params.id);
    }

    await user.save();
    res.json({ isSaved: !isSaved });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete all posts (temporary route for cleanup)
router.delete('/all', auth, async (req, res) => {
  try {
    // Only allow admin or specific user to delete all posts (you can modify this condition)
    // For now, allowing any authenticated user - remove this in production
    console.log('Deleting all posts...');

    // Delete all posts
    const deletedPosts = await Post.deleteMany({});
    console.log(`Deleted ${deletedPosts.deletedCount} posts`);

    // Delete all comments (since they're linked to posts)
    const deletedComments = await Comment.deleteMany({});
    console.log(`Deleted ${deletedComments.deletedCount} comments`);

    // Delete post-related notifications
    const deletedNotifications = await Notification.deleteMany({
      type: { $in: ['like', 'comment'] }
    });
    console.log(`Deleted ${deletedNotifications.deletedCount} post-related notifications`);

    res.json({
      message: 'All posts, comments, and related notifications have been deleted successfully!',
      deletedPosts: deletedPosts.deletedCount,
      deletedComments: deletedComments.deletedCount,
      deletedNotifications: deletedNotifications.deletedCount
    });
  } catch (error) {
    console.error('Delete all posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
