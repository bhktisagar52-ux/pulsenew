const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Notification');

async function checkNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_social');
    const Notification = mongoose.model('Notification');
    const count = await Notification.countDocuments();
    console.log('Total notifications in database:', count);

    if (count > 0) {
      const notifications = await Notification.find()
        .populate('user', 'username')
        .populate('fromUser', 'username')
        .limit(5);
      console.log('Sample notifications:');
      notifications.forEach(n => {
        console.log('- Type:', n.type, 'User:', n.user?.username, 'From:', n.fromUser?.username, 'Message:', n.message);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkNotifications();
