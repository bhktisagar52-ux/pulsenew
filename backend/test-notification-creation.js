require('dotenv').config();
const mongoose = require('mongoose');

// Load models
require('./models/User');
require('./models/Post');
require('./models/Comment');
require('./models/Notification');

const Notification = mongoose.model('Notification');
const User = mongoose.model('User');

async function testNotificationCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_social', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find some users to test with
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('Not enough users in database. Please create at least 2 users first.');
      return;
    }

    console.log('Found users:', users.map(u => ({ id: u._id, username: u.username })));

    // Create a test notification
    const testNotification = new Notification({
      user: users[0]._id, // recipient
      type: 'follow',
      fromUser: users[1]._id, // sender
      message: `${users[1].username} started following you (test notification)`
    });

    await testNotification.save();
    console.log('Test notification created successfully:', testNotification._id);

    // Check total notifications
    const totalNotifications = await Notification.countDocuments();
    console.log('Total notifications in database:', totalNotifications);

    // List all notifications
    const allNotifications = await Notification.find().populate('user', 'username').populate('fromUser', 'username');
    console.log('All notifications:');
    allNotifications.forEach(notif => {
      console.log(`- ${notif.type}: ${notif.message} (ID: ${notif._id})`);
    });

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testNotificationCreation();
