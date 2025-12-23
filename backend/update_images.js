const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Post');
require('./models/Story');

const Post = mongoose.model('Post');
const Story = mongoose.model('Story');

async function updateImages() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_social');

  // Update posts
  await Post.updateMany(
    { image: { $regex: '^/uploads/' } },
    [{ $set: { image: { $concat: ['http://localhost:5000', '$image'] } } }]
  );

  // Update stories
  await Story.updateMany(
    { mediaUrl: { $regex: '^/uploads/' } },
    [{ $set: { mediaUrl: { $concat: ['http://localhost:5000', '$mediaUrl'] } } }]
  );

  console.log('Images updated');
  process.exit();
}

updateImages();
