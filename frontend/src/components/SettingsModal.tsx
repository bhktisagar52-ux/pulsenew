'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showAppVersion, setShowAppVersion] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleEditProfile = () => {
    onClose();
    router.push('/edit-profile');
  };

  const handleChangePassword = () => {
    onClose();
    router.push('/change-password');
  };

  const handlePrivacySettings = () => {
    onClose();
    router.push('/privacy-settings');
  };

  const handleSavedPosts = () => {
    onClose();
    router.push('/my-profile?tab=saved');
  };

  const handleArchive = () => {
    onClose();
    router.push('/my-profile?tab=archive');
  };

  const handleCloseFriends = () => {
    onClose();
    router.push('/my-profile?tab=close-friends');
  };

  const handleHelpCenter = () => {
    window.open('https://help.pulse.com', '_blank');
  };

  const handleReportProblem = () => {
    window.open('https://help.pulse.com/report', '_blank');
  };

  const handleTermsOfService = () => {
    window.open('https://pulse.com/terms', '_blank');
  };

  const handlePrivacyPolicy = () => {
    window.open('https://pulse.com/privacy', '_blank');
  };

  const handleAppVersion = () => {
    setShowAppVersion(!showAppVersion);
  };

  const handleWhatsNew = () => {
    setShowWhatsNew(!showWhatsNew);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Options */}
        <div className="py-2">
          {/* Account Settings */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Account</h3>
            <div className="space-y-1">
              <button
                onClick={handleEditProfile}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={handleChangePassword}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={handlePrivacySettings}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Privacy Settings
              </button>
            </div>
          </div>

          {/* Content Settings */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Content</h3>
            <div className="space-y-1">
              <button
                onClick={handleSavedPosts}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Saved Posts
              </button>
              <button
                onClick={handleArchive}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Archive
              </button>
              <button
                onClick={handleCloseFriends}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Close Friends
              </button>
            </div>
          </div>

          {/* Support */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Support</h3>
            <div className="space-y-1">
              <button
                onClick={handleHelpCenter}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Help Center
              </button>
              <button
                onClick={handleReportProblem}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Report a Problem
              </button>
              <button
                onClick={handleTermsOfService}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={handlePrivacyPolicy}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {/* About */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3">About</h3>
            <div className="space-y-1">
              <button
                onClick={handleAppVersion}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                App Version
              </button>
              {showAppVersion && (
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 rounded-md">
                  Pulse v1.0.0
                </div>
              )}
              <button
                onClick={handleWhatsNew}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                What's New
              </button>
              {showWhatsNew && (
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 rounded-md">
                  <div className="font-medium mb-1">Recent Updates:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Settings modal with full functionality</li>
                    <li>Real-time chat updates</li>
                    <li>Story reactions and views</li>
                    <li>Enhanced notification system</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          <div className="px-4 py-3">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Logged in as <span className="font-medium text-gray-700">{user?.username}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
