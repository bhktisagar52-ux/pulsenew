'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
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

export default function SavedPostsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSavedPosts();
    }
  }, [user, authLoading]);

  const fetchSavedPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.get('/api/posts/saved');
      // Sort by createdAt (latest first) since we don't have saved timestamps
      const sortedPosts = response.data.sort((a: Post, b: Post) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSavedPosts(sortedPosts);
    } catch (err: any) {
      console.error('Error fetching saved posts:', err);
      setError(err.response?.data?.message || 'Failed to load saved posts');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white transition-colors duration-300">
      {/* Header */}
      <header className="glass-card shadow-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/my-profile')}
              className="text-gray-400 hover:text-gray-300 text-xl transition-colors"
              title="Back to Profile"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-white">Saved Posts</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-yellow-400 text-lg">🔖</span>
            <span className="text-gray-400 text-sm">{savedPosts.length} saved</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="glass-card rounded-lg shadow-md p-6 text-center border border-gray-700 mb-6">
            <div className="text-red-400 text-lg mb-2">⚠️</div>
            <div className="text-red-400">{error}</div>
          </div>
        )}

        {savedPosts.length === 0 ? (
          <div className="glass-card rounded-lg shadow-md p-12 text-center border border-gray-700">
            <div className="text-6xl mb-4">🔖</div>
            <h3 className="text-xl font-medium text-white mb-2">No saved posts yet</h3>
            <p className="text-gray-400 mb-6">Save posts and reels you love to see them here!</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Explore Posts
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {savedPosts.map((post) => (
              <div key={post._id} className="glass-card rounded-lg shadow-md border border-gray-700 overflow-hidden">
                {post.postType === 'reel' ? (
                  <div className="relative">
                    {/* Reel indicator */}
                    <div className="absolute top-3 left-3 z-10 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <span>🎬</span>
                      <span>REEL</span>
                    </div>
                    {/* For reels, we'll show them in a compact format */}
                    <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                      <video
                        src={post.image}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <img
                          src={post.author.profilePicture || '/default-avatar.png'}
                          alt={post.author.username}
                          className="w-8 h-8 rounded-full border border-gray-600"
                        />
                        <span className="font-medium text-white">{post.author.username}</span>
                      </div>
                      <p className="text-gray-300 mb-3">{post.content}</p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-4">
                          <span>❤️ {post.likes.length}</span>
                          <span>💬 {post.comments.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <PostCard
                    post={post}
                    currentUserId={user._id}
                    onLike={(postId) => {
                      // Update local state for immediate feedback
                      setSavedPosts(prev => prev.map(p =>
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
                      fetchSavedPosts();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
