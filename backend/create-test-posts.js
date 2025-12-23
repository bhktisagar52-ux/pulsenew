require('dotenv').config();
const mongoose = require('mongoose');

// Load models
require('./models/User');
require('./models/Post');
require('./models/Comment');

const User = mongoose.model('User');
const Post = mongoose.model('Post');

async function createTestPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_social', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get existing users
    const users = await User.find({}, '_id username');
    if (users.length < 2) {
      console.log('Need at least 2 users to create test posts');
      return;
    }

    console.log('Creating test posts with different dates...');

    const testPosts = [
      {
        author: users[0]._id,
        content: 'This is an old post from yesterday',
        image: 'http://localhost:5000/uploads/test-image-1.jpg',
        postType: 'post',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        likes: [],
        comments: []
      },
      {
        author: users[1]._id,
        content: 'This is an older post from 3 days ago',
        image: 'http://localhost:5000/uploads/test-image-2.jpg',
        postType: 'post',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        likes: [],
        comments: []
      },
      {
        author: users[0]._id,
        content: 'This is a very old post from a week ago',
        image: 'http://localhost:5000/uploads/test-image-3.jpg',
        postType: 'post',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        likes: [],
        comments: []
      },
      {
        author: users[1]._id,
        content: 'This is the newest post',
        image: 'http://localhost:5000/uploads/test-image-4.jpg',
        postType: 'post',
        createdAt: new Date(), // Now
        likes: [],
        comments: []
      }
    ];

    // Create the posts
    for (const postData of testPosts) {
      const post = new Post(postData);
      await post.save();
      console.log(`Created post: "${post.content}" from ${new Date(post.createdAt).toLocaleDateString()}`);
    }

    console.log('\nTest posts created successfully!');
    console.log('You should now see posts from different dates when you refresh the app.');

  } catch (error) {
    console.error('Error creating test posts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

createTestPosts();
