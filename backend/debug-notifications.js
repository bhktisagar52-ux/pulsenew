const mongoose = require('mongoose');
require('dotenv').config();

// Load all models
require('./models/User');
require('./models/Post');
require('./models/Comment');
require('./models/Story');
require('./models/Conversation');
require('./models/Message');
require('./models/Notification');

async function debugNotifications() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_social', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    const Notification = mongoose.model('Notification');
    const User = mongoose.model('User');

    // Get all users
    const users = await User.find().limit(2);
    console.log(`Found ${users.length} users`);

    if (users.length < 2) {
      console.log('Need at least 2 users to test notifications');
      await mongoose.disconnect();
      return;
    }

    console.log('Users:', users.map(u => ({ id: u._id, username: u.username })));

    // Try to create a notification
    console.log('Creating test notification...');
    const notification = new Notification({
      user: users[1]._id,
      type: 'follow',
      fromUser: users[0]._id,
      message: `${users[0].username} sent you a test notification`
    });

    console.log('Notification object before save:', notification);

    const savedNotification = await notification.save();
    console.log('Notification saved successfully:', savedNotification);

    // Check total count
    const count = await Notification.countDocuments();
    console.log('Total notifications in database:', count);

    // Get all notifications
    const allNotifications = await Notification.find().populate('user', 'username').populate('fromUser', 'username');
    console.log('All notifications:');
    allNotifications.forEach(n => {
      console.log(`- ID: ${n._id}, Type: ${n.type}, User: ${n.user?.username}, From: ${n.fromUser?.username}, Message: ${n.message}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error in debugNotifications:', error);
    console.error('Error stack:', error.stack);
  }
}

debugNotifications();
