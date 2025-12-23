'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';

export default function EditProfilePage() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setBio(user.bio || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await api.post('/api/auth/upload-profile-picture', formData);
      setProfilePicture(response.data.profilePicture);
      await refreshUser();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);
    try {
      await api.put('/api/auth/me', { username, email, bio, profilePicture });
      await refreshUser();
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <button
            onClick={() => router.push('/profile')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Profile
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="text-center mb-6">
            <img
              src={profilePicture || '/default-avatar.png'}
              alt={username}
              className="w-24 h-24 rounded-full mx-auto mb-4 cursor-pointer border-2 border-gray-300"
              onClick={handleImageClick}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <p className="text-sm text-gray-500 mb-4">Click the image to upload a new profile picture</p>
            <h2 className="text-xl font-semibold">{username}</h2>
            <p className="text-gray-600">{email}</p>
            {bio && <p className="text-gray-500 mt-2">{bio}</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            {success && <p className="text-green-600 mb-4">Profile updated successfully!</p>}

            <div className="mb-4">
              <label htmlFor="username" className="block mb-1 font-semibold">Username</label>
              <input
                type="text"
                id="username"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block mb-1 font-semibold">Email</label>
              <input
                type="email"
                id="email"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="bio" className="block mb-1 font-semibold">Bio</label>
              <textarea
                id="bio"
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
