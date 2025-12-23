'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';

export default function PrivacySettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState({
    isPrivate: false,
    showOnlineStatus: true,
    allowMessagesFrom: 'everyone', // 'everyone', 'following', 'none'
    allowTagging: true,
    showActivityStatus: true,
    blockList: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchPrivacySettings();
    }
  }, [user, authLoading, router]);

  const fetchPrivacySettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/privacy-settings');
      setSettings(response.data.settings || settings);
    } catch (err: any) {
      console.error('Error fetching privacy settings:', err);
      // Use default settings if not found
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await api.put('/api/auth/privacy-settings', { settings });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (authLoading || loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Privacy Settings</h1>
          <button
            onClick={() => router.push('/profile')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Profile
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {error && <p className="text-red-600 mb-4">{error}</p>}
          {success && <p className="text-green-600 mb-4">Settings saved successfully!</p>}

          {/* Account Privacy */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Privacy</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Private Account</h3>
                  <p className="text-sm text-gray-600">Only approved followers can see your posts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.isPrivate}
                    onChange={(e) => handleSettingChange('isPrivate', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Show Online Status</h3>
                  <p className="text-sm text-gray-600">Let others see when you're active</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.showOnlineStatus}
                    onChange={(e) => handleSettingChange('showOnlineStatus', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Show Activity Status</h3>
                  <p className="text-sm text-gray-600">Show when you're reading messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.showActivityStatus}
                    onChange={(e) => handleSettingChange('showActivityStatus', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Interactions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Interactions</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Who can send you messages?</h3>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={settings.allowMessagesFrom}
                  onChange={(e) => handleSettingChange('allowMessagesFrom', e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="following">People you follow</option>
                  <option value="none">No one</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Allow others to tag you</h3>
                  <p className="text-sm text-gray-600">Let people tag you in posts and stories</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.allowTagging}
                    onChange={(e) => handleSettingChange('allowTagging', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
