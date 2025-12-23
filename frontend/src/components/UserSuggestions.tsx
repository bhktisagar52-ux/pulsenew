'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
  bio?: string;
}

export default function UserSuggestions() {
  const { user, followUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/auth/users-not-followed');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    setFollowing(prev => new Set(prev).add(userId));
    try {
      await followUser(userId);
      // Remove from list
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      console.error('Error following user:', error);
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-400">Loading suggestions...</div>;
  }

  if (users.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-white">Suggestions for you</h3>
        <p className="text-gray-500">No more users to follow</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-lg font-semibold mb-4 text-white">Suggestions for you</h3>
      <div className="space-y-4">
        {users.slice(0, 5).map((suggestedUser) => (
          <div key={suggestedUser._id} className="flex items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-800 rounded-lg p-2 -m-2 flex-1 transition-colors"
              onClick={() => router.push(`/profile/${suggestedUser._id}`)}
            >
              <img
                src={suggestedUser.profilePicture || '/default-avatar.png'}
                alt={suggestedUser.username}
                className="w-10 h-10 rounded-full border-2 border-blue-500"
              />
              <div>
                <p className="font-medium text-white">{suggestedUser.username}</p>
                {suggestedUser.bio && (
                  <p className="text-sm text-gray-400 truncate max-w-32">{suggestedUser.bio}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleFollow(suggestedUser._id)}
              disabled={following.has(suggestedUser._id)}
              className="px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {following.has(suggestedUser._id) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
