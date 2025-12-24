'use client';

import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
  bio?: string;
}

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followers' | 'following';
  userId: string;
  currentUserId: string;
}

export default function FollowersFollowingModal({
  isOpen,
  onClose,
  type,
  userId,
  currentUserId
}: FollowersFollowingModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, type, userId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/auth/user/${userId}/${type}`);
      setUsers(response.data[type] || []);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUnfollow = async (targetUserId: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await api.post('/api/auth/unfollow', { userId: targetUserId });
      } else {
        await api.post('/api/auth/follow', { userId: targetUserId });
      }
      // Refresh the list after follow/unfollow
      fetchUsers();
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white capitalize">{type}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder={`Search ${type}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Users List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {searchQuery ? `No ${type} found matching "${searchQuery}"` : `No ${type} yet`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredUsers.map((user) => {
                const isCurrentUser = user._id === currentUserId;
                const isFollowing = users.some(u => u._id === user._id); // This would need to be checked differently

                return (
                  <div key={user._id} className="flex items-center justify-between p-4 hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.profilePicture || '/default-avatar.png'}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-white font-medium">{user.username}</p>
                        {user.bio && (
                          <p className="text-gray-400 text-sm truncate max-w-48">{user.bio}</p>
                        )}
                      </div>
                    </div>

                    {!isCurrentUser && (
                      <button
                        onClick={() => handleFollowUnfollow(user._id, isFollowing)}
                        className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                          isFollowing
                            ? 'bg-gray-600 text-white hover:bg-gray-500'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
