'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../utils/api';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
}

interface Notification {
  _id: string;
  type: 'follow' | 'like' | 'comment' | 'post';
  fromUser: User;
  postId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      console.log('Fetching notifications...');
      const response = await api.get('/api/notifications');
      console.log('Notifications response:', response.data);

      let notificationsData = response.data;

      // Mark all notifications as read when panel opens
      if (notificationsData.length > 0) {
        await api.put('/api/notifications/mark-all-read');
        // Update local data to mark as read
        notificationsData = notificationsData.map(notif => ({ ...notif, read: true }));
      }

      setNotifications(notificationsData);
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error);
      const axiosError = error as { response?: { data?: unknown; status?: number } };
      console.error('Error response:', axiosError.response?.data);
      console.error('Error status:', axiosError.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notif =>
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error: unknown) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error: unknown) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        router.push(`/profile/${notification.fromUser._id}`);
        break;
      case 'like':
      case 'comment':
        // Navigate to the specific post if postId is available
        if (notification.postId) {
          router.push(`/posts/${notification.postId}`);
        } else {
          router.push(`/profile/${notification.fromUser._id}`);
        }
        break;
      case 'post':
        router.push(`/profile/${notification.fromUser._id}`);
        break;
    }

    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return '👤';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'post':
        return '📝';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md h-full bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-white mb-2">No notifications yet</h3>
              <p className="text-gray-400 text-center">
                When someone interacts with your content, you'll see it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 cursor-pointer hover:bg-gray-800 transition-colors ${
                    !notification.read ? 'bg-gray-800 bg-opacity-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <img
                        src={notification.fromUser.profilePicture || '/default-avatar.png'}
                        alt={notification.fromUser.username}
                        className="w-10 h-10 rounded-full border-2 border-gray-600"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <p className="text-sm text-gray-200 flex-1">
                          <span className="font-medium text-white">
                            {notification.fromUser.username}
                          </span>
                          {' '}
                          {notification.message}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
