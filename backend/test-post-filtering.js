require('dotenv').config();
const mongoose = require('mongoose');

// Load models
require('./models/Post');
require('./models/User');
require('./models/Comment');

const Post = mongoose.model('Post');
const User = mongoose.model('User');

async function testPostFiltering() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_social', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}, 'username _id followers following privacySettings');
    console.log('\nUsers in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user._id})`);
      console.log(`   Followers: ${user.followers ? user.followers.length : 0}`);
      console.log(`   Following: ${user.following ? user.following.length : 0}`);
      console.log(`   Privacy: ${user.privacySettings ? (user.privacySettings.isPrivate ? 'Private' : 'Public') : 'Public (no settings)'}`);
      console.log('');
    });

    // Test filtering for each user
    for (const currentUser of users) {
      console.log(`\n--- Testing posts visible to ${currentUser.username} ---`);

      // Simulate the filtering logic from posts.js
      let posts = await Post.find({})
        .populate('author', 'username profilePicture privacySettings followers')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username profilePicture'
          }
        })
        .sort({ createdAt: -1 });

      console.log(`Before filtering: ${posts.length} posts`);

      // Filter posts based on privacy settings
      const currentUserId = currentUser._id.toString();
      posts = posts.filter(post => {
        const author = post.author;
        // Always show user's own posts
        if (author._id.toString() === currentUserId) {
          console.log(`  - Showing own post: ${post.content.substring(0, 30)}...`);
          return true;
        }

        if (!author.privacySettings || !author.privacySettings.isPrivate) {
          // Public account - show all posts
          console.log(`  - Showing public post from ${author.username}: ${post.content.substring(0, 30)}...`);
          return true;
        }

        // Private account - only show to followers
        const isFollower = author.followers && author.followers.some(follower =>
          follower.toString() === currentUserId
        );

        if (isFollower) {
          console.log(`  - Showing private post from ${author.username} (user is follower): ${post.content.substring(0, 30)}...`);
        } else {
          console.log(`  - Hiding private post from ${author.username} (user is not follower): ${post.content.substring(0, 30)}...`);
        }

        return isFollower;
      });

      console.log(`After filtering: ${posts.length} posts visible to ${currentUser.username}`);

      // Remove privacySettings from response (simulate API response)
      const cleanPosts = posts.map(post => {
        const postObj = post.toObject();
        delete postObj.author.privacySettings;
        delete postObj.author.followers;
        return postObj;
      });

      console.log('Visible posts:');
      cleanPosts.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.author.username}: ${post.content.substring(0, 50)}...`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('Error testing post filtering:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

testPostFiltering();
