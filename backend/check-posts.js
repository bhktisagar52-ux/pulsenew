require('dotenv').config();
const mongoose = require('mongoose');

// Load Post model
require('./models/Post');
require('./models/User');

const Post = mongoose.model('Post');

async function checkPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_social', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Count total posts
    const totalPosts = await Post.countDocuments();
    console.log(`Total posts in database: ${totalPosts}`);

    if (totalPosts > 0) {
      // Get all posts
      const posts = await Post.find({})
        .populate('author', 'username privacySettings followers')
        .sort({ createdAt: -1 });

      console.log(`\nAll ${posts.length} posts:`);
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ID: ${post._id}`);
        console.log(`   Author: ${post.author.username}`);
        console.log(`   Content: ${post.content.substring(0, 50)}...`);
        console.log(`   Created: ${post.createdAt}`);
        console.log(`   Privacy: ${post.author.privacySettings ? (post.author.privacySettings.isPrivate ? 'Private' : 'Public') : 'Public (no settings)'}`);
        console.log('');
      });
    }

    // Check for posts with images
    const postsWithImages = await Post.countDocuments({ image: { $ne: '' } });
    console.log(`Posts with images: ${postsWithImages}`);

    // Check for posts without images
    const postsWithoutImages = await Post.countDocuments({ image: '' });
    console.log(`Posts without images: ${postsWithoutImages}`);

  } catch (error) {
    console.error('Error checking posts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

checkPosts();
