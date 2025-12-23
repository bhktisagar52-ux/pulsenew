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
  profilePicture?: string;
  bio?: string;
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

interface Reel {
  _id: string;
  content: string;
  image: string;
  author: User;
  createdAt: string;
  likes: string[];
  comments: any[];
}

export default function Search() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'hashtags' | 'people' | 'posts' | 'reels'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [people, setPeople] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchCounts, setSearchCounts] = useState({
    hashtags: 0,
    people: 0,
    posts: 0,
    reels: 0
  });

  useEffect(() => {
    if (user && searchQuery.trim()) {
      performSearch();
    }
  }, [searchQuery, activeTab]);

  const performSearch = async () => {
    setLoadingSearch(true);
    try {
      const query = searchQuery.trim();
      if (!query) return;

      if (activeTab === 'all') {
        // Fetch all types of results
        const [hashtagResponse, peopleResponse, postsResponse, reelsResponse] = await Promise.all([
          api.get(`/api/posts/search?query=${encodeURIComponent('#' + query)}`),
          api.get(`/api/auth/users/search?query=${encodeURIComponent(query)}`),
          api.get(`/api/posts/search?query=${encodeURIComponent(query)}`),
          api.get(`/api/posts/search?query=${encodeURIComponent(query)}&type=reel`)
        ]);

        // Extract unique hashtags from posts
        const foundHashtags = new Set<string>();
        hashtagResponse.data.forEach((post: Post) => {
          const matches = post.content.match(/#[\w]+/g);
          if (matches) {
            matches.forEach(tag => foundHashtags.add(tag));
          }
        });

        setHashtags(Array.from(foundHashtags));
        setPeople(peopleResponse.data);
        setPosts(postsResponse.data);
        setReels(reelsResponse.data);

        // Update counts
        setSearchCounts({
          hashtags: foundHashtags.size,
          people: peopleResponse.data.length,
          posts: postsResponse.data.length,
          reels: reelsResponse.data.length
        });
      } else {
        switch (activeTab) {
          case 'hashtags':
            // Search for hashtags in posts
            const hashtagResponse = await api.get(`/api/posts/search?query=${encodeURIComponent('#' + query)}`);
            // Extract unique hashtags from results
            const foundHashtags = new Set<string>();
            hashtagResponse.data.forEach((post: Post) => {
              const matches = post.content.match(/#[\w]+/g);
              if (matches) {
                matches.forEach(tag => foundHashtags.add(tag));
              }
            });
            setHashtags(Array.from(foundHashtags));
            setSearchCounts(prev => ({ ...prev, hashtags: foundHashtags.size }));
            break;

          case 'people':
            const peopleResponse = await api.get(`/api/auth/users/search?query=${encodeURIComponent(query)}`);
            setPeople(peopleResponse.data);
            setSearchCounts(prev => ({ ...prev, people: peopleResponse.data.length }));
            break;

          case 'posts':
            const postsResponse = await api.get(`/api/posts/search?query=${encodeURIComponent(query)}`);
            setPosts(postsResponse.data);
            setSearchCounts(prev => ({ ...prev, posts: postsResponse.data.length }));
            break;

          case 'reels':
            const reelsResponse = await api.get(`/api/posts/search?query=${encodeURIComponent(query)}&type=reel`);
            setReels(reelsResponse.data);
            setSearchCounts(prev => ({ ...prev, reels: reelsResponse.data.length }));
            break;
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleHashtagClick = (hashtag: string) => {
    setSearchQuery(hashtag.replace('#', ''));
    setActiveTab('posts');
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
          <h1 className="text-2xl font-bold text-white">Search</h1>
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="text-blue-500 hover:text-blue-400 text-xl transition-colors"
              title="Home"
            >
              🏠
            </a>
          </div>
        </div>
      </header>

      {/* Search Input */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for hashtags, people, posts, or reels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              🔍
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'all', label: 'All', icon: '🔍' },
              { id: 'hashtags', label: 'Hashtags', icon: '#' },
              { id: 'people', label: 'People', icon: '👥' },
              { id: 'posts', label: 'Posts', icon: '📝' },
              { id: 'reels', label: 'Reels', icon: '🎥' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {searchQuery.trim() && searchCounts[tab.id as keyof typeof searchCounts] > 0 && (
                  <span className="ml-1 text-xs bg-blue-500 text-white px-1 py-0.5 rounded">
                    {searchCounts[tab.id as keyof typeof searchCounts]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loadingSearch ? (
          <div className="text-center py-8 text-gray-400">Searching...</div>
        ) : !searchQuery.trim() ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-300 mb-2">Search Pulse</h2>
            <p className="text-gray-500">Find hashtags, people, posts, and reels</p>
          </div>
        ) : (
          <div>
            {activeTab === 'all' && (
              <div className="space-y-8">
                {/* Hashtags Section */}
                {hashtags.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                      <span className="mr-2">#</span>
                      Hashtags
                      <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">
                        {hashtags.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                      {hashtags.slice(0, 8).map((hashtag) => (
                        <button
                          key={hashtag}
                          onClick={() => handleHashtagClick(hashtag)}
                          className="glass-card rounded-lg p-4 text-left hover:bg-gray-800 transition-colors border border-gray-700"
                        >
                          <div className="text-blue-400 font-medium">{hashtag}</div>
                          <div className="text-sm text-gray-400">Click to explore</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* People Section */}
                {people.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                      <span className="mr-2">👥</span>
                      People
                      <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">
                        {people.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      {people.slice(0, 6).map((person) => (
                        <div
                          key={person._id}
                          onClick={() => handleUserClick(person._id)}
                          className="glass-card rounded-lg p-6 cursor-pointer hover:bg-gray-800 transition-colors border border-gray-700"
                        >
                          <div className="text-center">
                            <img
                              src={person.profilePicture || '/default-avatar.png'}
                              alt={person.username}
                              className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-blue-500"
                            />
                            <h4 className="font-semibold text-white">{person.username}</h4>
                            {person.bio && (
                              <p className="text-sm text-gray-400 mt-2">{person.bio}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts Section */}
                {posts.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                      <span className="mr-2">📝</span>
                      Posts
                      <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">
                        {posts.length}
                      </span>
                    </h3>
                    <div className="space-y-6 mb-6">
                      {posts.slice(0, 5).map((post) => (
                        <PostCard
                          key={post._id}
                          post={post}
                          currentUserId={user._id}
                          onLike={() => {}}
                          onComment={() => {}}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Reels Section */}
                {reels.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                      <span className="mr-2">🎥</span>
                      Reels
                      <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">
                        {reels.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      {reels.slice(0, 6).map((reel) => (
                        <ReelItem
                          key={reel._id}
                          reel={reel}
                          isActive={false}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {hashtags.length === 0 && people.length === 0 && posts.length === 0 && reels.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">😔</div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No results found</h3>
                    <p className="text-gray-500">Try searching for something else</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hashtags' && (
              <div>
                <h3 className="text-xl font-semibold mb-6 text-white">Hashtags</h3>
                {hashtags.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No hashtags found</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {hashtags.map((hashtag) => (
                      <button
                        key={hashtag}
                        onClick={() => handleHashtagClick(hashtag)}
                        className="glass-card rounded-lg p-4 text-left hover:bg-gray-800 transition-colors border border-gray-700"
                      >
                        <div className="text-blue-400 font-medium">{hashtag}</div>
                        <div className="text-sm text-gray-400">Click to explore</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'people' && (
              <div>
                <h3 className="text-xl font-semibold mb-6 text-white">People</h3>
                {people.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No people found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {people.map((person) => (
                      <div
                        key={person._id}
                        onClick={() => handleUserClick(person._id)}
                        className="glass-card rounded-lg p-6 cursor-pointer hover:bg-gray-800 transition-colors border border-gray-700"
                      >
                        <div className="text-center">
                          <img
                            src={person.profilePicture || '/default-avatar.png'}
                            alt={person.username}
                            className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-blue-500"
                          />
                          <h4 className="font-semibold text-white">{person.username}</h4>
                          {person.bio && (
                            <p className="text-sm text-gray-400 mt-2">{person.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div>
                <h3 className="text-xl font-semibold mb-6 text-white">Posts</h3>
                {posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No posts found</div>
                ) : (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        currentUserId={user._id}
                        onLike={() => {}}
                        onComment={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reels' && (
              <div>
                <h3 className="text-xl font-semibold mb-6 text-white">Reels</h3>
                {reels.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No reels found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reels.map((reel) => (
                      <ReelItem
                        key={reel._id}
                        reel={reel}
                        isActive={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
