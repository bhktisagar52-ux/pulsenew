const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Post');
require('./models/Story');

const Post = mongoose.model('Post');
const Story = mongoose.model('Story');

async function updateImages() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Update posts - convert local paths to Cloudinary URLs
  const posts = await Post.find({ image: { $regex: '^/uploads/' } });
  console.log(`Found ${posts.length} posts with local image paths`);

  for (const post of posts) {
    // Extract filename from local path
    const filename = post.image.replace('/uploads/', '');

    // Create Cloudinary URL
    post.image = `https://res.cloudinary.com/pulse_social/image/upload/v1/pulse_social/${filename}`;
    await post.save();
  }

  // Update stories - convert local paths to Cloudinary URLs
  const stories = await Story.find({ mediaUrl: { $regex: '^/uploads/' } });
  console.log(`Found ${stories.length} stories with local media paths`);

  for (const story of stories) {
    // Extract filename from local path
    const filename = story.mediaUrl.replace('/uploads/', '');

    // Create Cloudinary URL
    story.mediaUrl = `https://res.cloudinary.com/pulse_social/image/upload/v1/pulse_social/${filename}`;
    await story.save();
  }

  console.log(`Updated ${posts.length} posts and ${stories.length} stories to use Cloudinary URLs`);
  process.exit();
}

updateImages();
