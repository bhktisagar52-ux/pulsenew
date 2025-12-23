'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';

export default function ChangePasswordPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await api.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
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
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
          <button
            onClick={() => router.push('/profile')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Profile
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            {success && <p className="text-green-600 mb-4">Password changed successfully!</p>}

            <div className="mb-4">
              <label htmlFor="currentPassword" className="block mb-1 font-semibold">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="newPassword" className="block mb-1 font-semibold">New Password</label>
              <input
                type="password"
                id="newPassword"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block mb-1 font-semibold">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
