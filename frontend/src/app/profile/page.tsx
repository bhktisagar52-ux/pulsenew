'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';
import PostGridItem from '../../components/PostGridItem';
import StoryHighlight from '../../components/StoryHighlight';
import PostCard from '../../components/PostCard';

interface Post {
  _id: string;
  postType: 'post' | 'reel';
  content: string;
  image?: string;
  author: any;
  createdAt: string;
  likes: string[];
  comments: any[];
}

interface Story {
  _id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'stories' | 'feed'>('posts');
  const [stats, setStats] = useState({ posts: 0, reels: 0, stories: 0 });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      fetchProfileData();
    }
  }, [user, authLoading]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [postsResponse, reelsResponse, storiesResponse] = await Promise.all([
        api.get('/api/posts', { params: { author: user!._id, postType: 'post' } }),
        api.get('/api/posts', { params: { author: user!._id, postType: 'reel' } }),
        api.get(`/api/stories/user/${user!._id}`)
      ]);

      setPosts(postsResponse.data);
      setReels(reelsResponse.data);
      setStories(storiesResponse.data);

      setStats({
        posts: postsResponse.data.length,
        reels: reelsResponse.data.length,
        stories: storiesResponse.data.length
      });
    } catch (err: any) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post =>
      post._id === postId
        ? {
            ...post,
            likes: (post.likes || []).includes(user!._id)
              ? (post.likes || []).filter(id => id !== user!._id)
              : [...(post.likes || []), user!._id]
          }
        : post
    ));
    setReels(reels.map(reel =>
      reel._id === postId
        ? {
            ...reel,
            likes: (reel.likes || []).includes(user!._id)
              ? (reel.likes || []).filter(id => id !== user!._id)
              : [...(reel.likes || []), user!._id]
          }
        : reel
    ));
  };

  const handleComment = (postId: string, content: string) => {
    // For simplicity, we'll refetch posts after commenting
    fetchProfileData();
  };

  const handlePostClick = (post: Post) => {
    router.push(`/feed/${post.author._id}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="grid grid-cols-3 gap-1 md:gap-4 p-4">
            {posts.map((post) => (
              <PostGridItem key={post._id} post={post} />
            ))}
            {posts.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-400 text-lg">No posts yet</p>
                <p className="text-gray-500 text-sm mt-2">Share your first post!</p>
              </div>
            )}
          </div>
        );
      case 'reels':
        return (
          <div className="grid grid-cols-3 gap-1 md:gap-4 p-4">
            {reels.map((reel) => (
              <PostGridItem key={reel._id} post={reel} />
            ))}
            {reels.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-400 text-lg">No reels yet</p>
                <p className="text-gray-500 text-sm mt-2">Create your first reel!</p>
              </div>
            )}
          </div>
        );
      case 'feed':
        const combinedFeed = [...posts, ...reels].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return (
          <div className="space-y-6 p-4">
            {combinedFeed.map((post) => (
              <div key={post._id} onClick={() => handlePostClick(post)} className="cursor-pointer">
                <PostCard
                  post={post}
                  currentUserId={user._id}
                  onLike={handleLike}
                  onComment={handleComment}
                />
              </div>
            ))}
            {combinedFeed.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No posts or reels yet</p>
                <p className="text-gray-500 text-sm mt-2">Share your first post or reel!</p>
              </div>
            )}
          </div>
        );
      case 'stories':
        return (
          <div className="p-4">
            <StoryHighlight stories={stories} />
            {stories.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-lg">No stories yet</p>
                <p className="text-gray-500 text-sm mt-2">Share your moments!</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Button */}
        <div className="m-4 mb-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
          >
            <span className="text-xl">←</span>
            <span>Home</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="glass-card m-4 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={user.profilePicture || '/default-avatar.png'}
                alt={user.username}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-blue-500 object-cover"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold">{user.username}</h1>
                <button
                  onClick={() => router.push('/edit-profile')}
                  className="mt-2 md:mt-0 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Edit Profile
                </button>
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start space-x-8 mb-4">
                <div className="text-center">
                  <div className="font-bold text-xl">{stats.posts + stats.reels}</div>
                  <div className="text-gray-400 text-sm">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{user.followers?.length || 0}</div>
                  <div className="text-gray-400 text-sm">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{user.following?.length || 0}</div>
                  <div className="text-gray-400 text-sm">Following</div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-gray-300 text-sm md:text-base">{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stories Highlight */}
        {stories.length > 0 && (
          <div className="mx-4">
            <StoryHighlight stories={stories} />
          </div>
        )}

        {/* Tabs */}
        <div className="glass-card mx-4 mb-4">
        <div className="flex justify-center space-x-8 py-4">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'feed'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span>📱</span>
            <span>Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'posts'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span>📸</span>
            <span>Posts</span>
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'reels'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span>🎥</span>
            <span>Reels</span>
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'stories'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span>📖</span>
            <span>Stories</span>
          </button>
        </div>
        </div>

        {/* Content */}
        <div className="glass-card mx-4 mb-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
