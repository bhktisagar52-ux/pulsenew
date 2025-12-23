'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import PostForm from '../components/PostForm';
import PostCard from '../components/PostCard';
import StoryCard from '../components/StoryCard';
import StoryForm from '../components/StoryForm';
import StoryViewer from '../components/StoryViewer';
import UserSuggestions from '../components/UserSuggestions';
import NotificationPanel from '../components/NotificationPanel';
import SettingsModal from '../components/SettingsModal';
import api from '../utils/api';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
}

interface Comment {
  _id: string;
  content: string;
  author: User;
  createdAt: string;
  likes: string[];
}

interface Post {
  _id: string;
  postType: 'post' | 'reel';
  content: string;
  image?: string;
  author: User;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

interface Story {
  _id: string;
  author: User;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  views: Array<{
    user: User;
    viewedAt: Date;
  }>;
  reactions: Array<{
    user: User;
    emoji: string;
    reactedAt: Date;
  }>;
  createdAt: string;
  expiresAt: string;
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingStories, setLoadingStories] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchStories();
      fetchUnreadNotifications();
      fetchUnreadMessages();
    }
  }, [user]);

  // Fetch unread notifications and messages periodically
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchUnreadNotifications();
        fetchUnreadMessages();
      }, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  // Refresh notification count when panel opens/closes
  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
    }
  }, [showNotifications, user]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      console.log('Fetching posts...');
      const response = await api.get('/api/posts');
      console.log('Posts fetched:', response.data.length, 'posts');
      console.log('Posts data:', response.data);
      setPosts(response.data);
    } catch (error: any) {
      console.error('Error fetching posts:', error.response?.data || error.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchStories = async () => {
    setLoadingStories(true);
    try {
      const response = await api.get('/api/stories');
      setStories(response.data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      setUnreadNotifications(response.data.count);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await api.get('/api/chat/unread-count');
      setUnreadMessages(response.data.count);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handleStoryCreated = () => {
    fetchStories();
  };

  const handleStoryView = async (storyId: string) => {
    try {
      // Record the view in the backend
      await api.post(`/api/stories/${storyId}/view`);
      // Refetch stories to get updated views with populated user data
      fetchStories();
    } catch (error) {
      console.error('Error recording story view:', error);
    }
  };

  const handleStoryDelete = (storyId: string) => {
    setStories(stories.filter(story => story._id !== storyId));
  };

  const handleOpenStoryViewer = async (storyIndex: number) => {
    setCurrentStoryIndex(storyIndex);
    // Record the view before opening the modal
    await handleStoryView(stories[storyIndex]._id);
    setShowStoryViewer(true);
  };

  const handleCloseStoryViewer = () => {
    setShowStoryViewer(false);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post =>
      post._id === postId
        ? {
            ...post,
            likes: post.likes.includes(user!._id)
              ? post.likes.filter(id => id !== user!._id)
              : [...post.likes, user!._id]
          }
        : post
    ));
  };

  const handleComment = (postId: string, content: string) => {
    // For simplicity, we'll refetch posts after commenting
    fetchPosts();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Pulse</h1>
            <p className="text-gray-600">Connect with friends and share your moments</p>
          </div>

          {showRegister ? (
            <div>
              <RegisterForm />
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowRegister(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Already have an account? Login
                </button>
              </div>
            </div>
          ) : (
            <div>
              <LoginForm />
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowRegister(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Don't have an account? Register
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white transition-colors duration-300">
      {/* Header */}
      <header className="glass-card shadow-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Pulse</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/search')}
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors"
              title="Search"
            >
              🔍
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors relative"
              title="Notifications"
            >
              🔔
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>
            <a
              href="/reels"
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors"
              title="Reels"
            >
              🎥
            </a>
            <a
              href="/chat"
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors relative"
              title="Messages"
            >
              💬
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </a>
            <a
              href={`/profile/${user._id}`}
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors"
              title="Profile"
            >
              👤
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Stories Section */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {/* Add Story Button */}
            <div
              className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-all duration-200 relative overflow-hidden"
              onClick={() => setShowStoryForm(true)}
              style={{
                backgroundImage: `url(${user.profilePicture || '/default-avatar.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="text-2xl mb-1 text-white relative z-10 drop-shadow-lg">+</div>
              <div className="text-xs text-gray-300 relative z-10 drop-shadow-lg">Add Story</div>
            </div>

            {/* Stories */}
            {loadingStories ? (
              <div className="flex items-center justify-center w-20 h-20">
                <div className="text-sm text-gray-500">Loading...</div>
              </div>
            ) : stories.length === 0 ? (
              <div className="flex items-center justify-center w-20 h-20">
                <div className="text-sm text-gray-500">No stories yet</div>
              </div>
            ) : (
              stories.map((story, index) => (
                <StoryCard
                  key={story._id}
                  story={story}
                  storyIndex={index}
                  onView={handleStoryView}
                  onDelete={handleStoryDelete}
                  onOpenViewer={handleOpenStoryViewer}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Story Form Modal */}
      {showStoryForm && (
        <StoryForm
          onStoryCreated={handleStoryCreated}
          onClose={() => setShowStoryForm(false)}
        />
      )}

      {/* Story Viewer */}
      {showStoryViewer && (
        <StoryViewer
          stories={stories}
          initialStoryIndex={currentStoryIndex}
          onClose={handleCloseStoryViewer}
          onView={handleStoryView}
          onReact={fetchStories}
        />
      )}

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Main Feed - Centered */}
        <div className="space-y-6">
          <PostForm onPostCreated={handlePostCreated} />

          {loadingPosts ? (
            <div className="text-center py-8 text-gray-400">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="glass-card rounded-lg shadow-md p-8 text-center border border-gray-700">
              <p className="text-gray-400">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={user._id}
                onLike={handleLike}
                onComment={handleComment}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
