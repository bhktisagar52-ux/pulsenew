const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching notifications for user:', req.user.id);
    const notifications = await Notification.find({ user: req.user.id })
      .populate('fromUser', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log('Found notifications:', notifications.length);
    console.log('Notifications data:', notifications);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notifications count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read for the current user
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read', updatedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new notification
router.post('/', auth, async (req, res) => {
  try {
    const { type, fromUser, message } = req.body;

    const notification = new Notification({
      user: req.user._id,
      type,
      fromUser,
      message
    });

    await notification.save();

    // Populate the fromUser field
    await notification.populate('fromUser', 'username profilePicture');

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
