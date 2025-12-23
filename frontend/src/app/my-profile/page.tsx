'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PostCard from '../../components/PostCard';
import ReelItem from '../../components/ReelItem';
import api from '../../utils/api';

interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  followers: string[];
  following: string[];
}

interface Post {
  _id: string;
  postType: 'post' | 'reel';
  content: string;
  image?: string;
  author: User;
  createdAt: string;
  likes: string[];
  comments: any[];
}

interface Story {
  _id: string;
  mediaType: string;
  mediaUrl: string;
  caption?: string;
  author: User;
  createdAt: string;
  views: any[];
}

interface Reel {
  _id: string;
  author: User;
  content: string;
  image: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

interface Comment {
  _id: string;
  content: string;
  author: User;
  createdAt: string;
  likes: string[];
}

export default function MyProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'stories'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserContent();
    }
  }, [user, authLoading]);

  const fetchUserContent = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch posts, reels, and stories
      const [postsResponse, reelsResponse, storiesResponse] = await Promise.all([
        api.get('/api/posts', { params: { author: user._id } }),
        api.get('/api/posts/reels'),
        api.get('/api/stories')
      ]);

      // Filter reels and stories for current user
      const userReels = reelsResponse.data.reels.filter((reel: Post) => reel.author._id === user._id && reel.image) as Reel[];
      const userStories = storiesResponse.data.filter((story: Story) => story.author._id === user._id);

      setPosts(postsResponse.data);
      setReels(userReels);
      setStories(userStories);
    } catch (err: any) {
      console.error('Error fetching user content:', err);
      setError(err.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  const totalPosts = posts.length;
  const totalReels = reels.length;
  const totalStories = stories.length;

  return (
    <div className="min-h-screen glass-card text-white transition-colors duration-300">
      {/* Header */}
      <header className="glass-card shadow-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white cursor-default">{user.username}</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/edit-profile')}
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors"
              title="Edit Profile"
            >
              ✏️
            </button>
            <Link
              href="/saved-posts"
              className="text-yellow-500 hover:text-yellow-400 text-xl transition-colors"
              title="Saved Posts"
            >
              🔖
            </Link>
            <a
              href="/"
              className="text-gray-400 hover:text-gray-300 text-xl transition-colors"
              title="Home"
            >
              🏠
            </a>
          </div>
        </div>
      </header>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
          <img
            src={user.profilePicture || '/default-avatar.png'}
            alt={user.username}
            className="w-32 h-32 rounded-full border-4 border-gray-600"
          />
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">{user.username}</h2>
            <p className="text-gray-300 mb-4">{user.bio || 'No bio available'}</p>
            <div className="flex space-x-8 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{totalPosts}</div>
                <div className="text-gray-400">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalReels}</div>
                <div className="text-gray-400">Reels</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalStories}</div>
                <div className="text-gray-400">Stories</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Posts ({totalPosts})
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'reels'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Reels ({totalReels})
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'stories'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Stories ({totalStories})
          </button>
        </div>

        {/* Content */}
        <div className="pb-8">
          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 text-lg">{error}</div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-xl font-medium text-white mb-2">No posts yet</h3>
                  <p className="text-gray-400">Share your first post to get started!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={user._id}
                    onLike={(postId) => {
                      // Update local state for immediate feedback
                      setPosts(prev => prev.map(p =>
                        p._id === postId
                          ? {
                              ...p,
                              likes: p.likes.includes(user._id)
                                ? p.likes.filter(id => id !== user._id)
                                : [...p.likes, user._id]
                            }
                          : p
                      ));
                    }}
                    onComment={(postId, content) => {
                      // Refetch to get updated comments
                      fetchUserContent();
                    }}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'reels' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reels.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-4xl mb-4">🎬</div>
                  <h3 className="text-xl font-medium text-white mb-2">No reels yet</h3>
                  <p className="text-gray-400">Create your first reel to get started!</p>
                </div>
              ) : (
                reels.map((reel) => (
                  <ReelItem key={reel._id} reel={reel} isActive={false} />
                ))
              )}
            </div>
          )}

          {activeTab === 'stories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-4xl mb-4">📖</div>
                  <h3 className="text-xl font-medium text-white mb-2">No stories yet</h3>
                  <p className="text-gray-400">Share your first story to get started!</p>
                </div>
              ) : (
                stories.map((story) => (
                  <div key={story._id} className="bg-gray-800 rounded-lg p-4">
                    <div className="aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
                      {story.mediaType === 'image' ? (
                        <img
                          src={story.mediaUrl}
                          alt={story.caption || 'Story'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={story.mediaUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                    </div>
                    <p className="text-white text-sm">{story.caption || 'No caption'}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(story.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
