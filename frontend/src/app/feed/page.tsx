'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import PostCard from '../../components/PostCard';
import api from '../../utils/api';

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

export default function Feed() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await api.get('/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingPosts(false);
    }
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

  const handlePostClick = (post: Post) => {
    router.push(`/feed/${post.author._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen glass-card text-white transition-colors duration-300">
      {/* Header */}
      <header className="glass-card shadow-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Feed</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/search')}
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors"
              title="Search"
            >
              🔍
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
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors"
              title="Messages"
            >
              💬
            </a>
            <a
              href={`/profile/${user._id}`}
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors"
              title="Profile"
            >
              👤
            </a>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-500 text-xl transition-colors"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {loadingPosts ? (
            <div className="text-center py-8 text-gray-400">Loading feed...</div>
          ) : posts.length === 0 ? (
            <div className="glass-card rounded-lg shadow-md p-8 text-center border border-gray-700">
              <p className="text-gray-400">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post._id} onClick={() => handlePostClick(post)} className="cursor-pointer">
                <PostCard
                  post={post}
                  currentUserId={user._id}
                  onLike={handleLike}
                  onComment={handleComment}
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
