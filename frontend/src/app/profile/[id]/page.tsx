'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../utils/api';
import PostGridItem from '../../../components/PostGridItem';
import StoryHighlight from '../../../components/StoryHighlight';

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
  mediaType: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const { user, loading: authLoading, followUser, unfollowUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'stories'>('posts');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      if (user._id === id) {
        // Redirect to new Instagram-style profile page for logged-in user
        router.push('/profile');
        return;
      }
      fetchUserProfile();
    }
  }, [user, authLoading, id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const [userResponse, postsResponse, reelsResponse, storiesResponse] = await Promise.all([
        api.get(`/api/auth/user/${id}`),
        api.get('/api/posts', { params: { author: id, postType: 'post' } }),
        api.get('/api/posts', { params: { author: id, postType: 'reel' } }),
        api.get(`/api/stories/user/${id}`)
      ]);

      if (!userResponse.data || !userResponse.data.user) {
        setError('User not found');
        setLoading(false);
        return;
      }

      setProfileUser(userResponse.data.user);
      setPosts(postsResponse.data);
      setReels(reelsResponse.data);
      setStories(storiesResponse.data);

      // Check if current user is following this user
      const following = (user.following || []).includes(id);
      setIsFollowing(following);

      // Check if mutual follow
      const mutual = following && (userResponse.data.user.following || []).includes(user._id);
      setIsMutual(mutual);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profileUser) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(id);
        setIsFollowing(false);
      } else {
        await followUser(id);
        setIsFollowing(true);
      }
      // Refetch to update states and ensure consistency
      await fetchUserProfile();
    } catch (err: any) {
      console.error('Follow error:', err);
      // Revert the optimistic update on error
      setIsFollowing(!isFollowing);
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchFollowers = async () => {
    setListLoading(true);
    try {
      const response = await api.get(`/api/auth/user/${id}/followers`);
      setFollowersList(response.data.followers);
      setShowFollowers(true);
    } catch (err: any) {
      console.error('Error fetching followers:', err);
    } finally {
      setListLoading(false);
    }
  };

  const fetchFollowing = async () => {
    setListLoading(true);
    try {
      const response = await api.get(`/api/auth/user/${id}/following`);
      setFollowingList(response.data.following);
      setShowFollowing(true);
    } catch (err: any) {
      console.error('Error fetching following:', err);
    } finally {
      setListLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-xl text-red-600">{error || 'User not found'}</div>
      </div>
    );
  }

  const isOwnProfile = user && user._id === id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back to Home Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
          >
            <span className="text-xl">←</span>
            <span>Home</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={profileUser.profilePicture || '/default-avatar.png'}
                alt={profileUser.username}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-blue-500 object-cover"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold">{profileUser.username}</h1>
                {isOwnProfile ? (
                  <button
                    onClick={() => router.push('/profile')}
                    className="mt-2 md:mt-0 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    My Profile
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`mt-2 md:mt-0 px-6 py-2 rounded-lg font-semibold transition-all ${
                      isFollowing
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    }`}
                  >
                    {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start space-x-8 mb-4">
                <div className="text-center">
                  <div className="font-bold text-xl">{posts.length + reels.length}</div>
                  <div className="text-gray-400 text-sm">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{profileUser.followers?.length || 0}</div>
                  <div className="text-gray-400 text-sm">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{profileUser.following?.length || 0}</div>
                  <div className="text-gray-400 text-sm">Following</div>
                </div>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <p className="text-gray-300 text-sm md:text-base">{profileUser.bio}</p>
              )}
            </div>
          </div>
        </div>

        {!isMutual && !isOwnProfile && (
          <div className="glass-card mx-4 mb-8 p-8 text-center">
            <p className="text-gray-400 text-lg">Follow each other to see posts, reels, and stories</p>
          </div>
        )}

        {(isMutual || isOwnProfile) && (
          <>
            {/* Stories Highlight */}
            {stories.length > 0 && (
              <div className="mx-4 mb-4">
                <StoryHighlight stories={stories} />
              </div>
            )}

            {/* Tabs */}
            <div className="glass-card mx-4 mb-4">
              <div className="flex justify-center space-x-8 py-4">
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
          {activeTab === 'posts' && (
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
          )}
          {activeTab === 'reels' && (
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
          )}
          {activeTab === 'stories' && (
            <div className="p-4">
              <StoryHighlight stories={stories} />
              {stories.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg">No stories yet</p>
                  <p className="text-gray-500 text-sm mt-2">Share your moments!</p>
                </div>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Followers</h3>
              <button
                onClick={() => setShowFollowers(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {listLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : followersList.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No followers yet</div>
            ) : (
              <div className="space-y-3">
                {followersList.map((follower) => (
                  <div
                    key={follower._id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      setShowFollowers(false);
                      router.push(`/profile/${follower._id}`);
                    }}
                  >
                    <img
                      src={follower.profilePicture || '/default-avatar.png'}
                      alt={follower.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{follower.username}</p>
                      {follower.bio && <p className="text-sm text-gray-500">{follower.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Following</h3>
              <button
                onClick={() => setShowFollowing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {listLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : followingList.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Not following anyone yet</div>
            ) : (
              <div className="space-y-3">
                {followingList.map((followed) => (
                  <div
                    key={followed._id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      setShowFollowing(false);
                      router.push(`/profile/${followed._id}`);
                    }}
                  >
                    <img
                      src={followed.profilePicture || '/default-avatar.png'}
                      alt={followed.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{followed.username}</p>
                      {followed.bio && <p className="text-sm text-gray-500">{followed.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
