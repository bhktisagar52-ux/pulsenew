const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Notification');
require('./models/User');

async function createTestNotification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_social');

    // Get first two users
    const User = mongoose.model('User');
    const users = await User.find().limit(2);

    if (users.length < 2) {
      console.log('Need at least 2 users to create a test notification');
      await mongoose.disconnect();
      return;
    }

    const Notification = mongoose.model('Notification');
    const notification = new Notification({
      user: users[1]._id, // Second user gets the notification
      type: 'follow',
      fromUser: users[0]._id, // First user sends it
      message: `${users[0].username} sent you a test notification`
    });

    await notification.save();
    console.log('Test notification created successfully');
    console.log('Notification:', {
      id: notification._id,
      user: users[1].username,
      fromUser: users[0].username,
      message: notification.message
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating test notification:', error);
  }
}

createTestNotification();
