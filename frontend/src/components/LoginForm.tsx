'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmailVerificationModal from './EmailVerificationModal';

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [showOTPModal, setShowOTPModal] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // Redirect or update UI after login
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPLogin = () => {
    if (!email.trim()) {
      setError('Please enter your email first');
      return;
    }
    setError(null);
    setShowOTPModal(true);
  };

  const handleOTPLoginSuccess = (token: string, user: any) => {
    // Store token and user data, then refresh to update auth context
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    window.location.reload();
  };

  return (
    <>
      <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {/* Login Mode Toggle */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setLoginMode('password')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMode === 'password'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('otp')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMode === 'otp'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            OTP Login
          </button>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

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

        {loginMode === 'password' ? (
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block mb-1 font-semibold">Password</label>
              <input
                type="password"
                id="password"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login with Password'}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-gray-600 mb-4 text-sm">
              We'll send a 6-digit OTP to your email for secure login.
            </p>
            <button
              onClick={handleOTPLogin}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              disabled={loading || !email.trim()}
            >
              Send OTP
            </button>
          </div>
        )}
      </div>

      <EmailVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        email={email}
        onSuccess={handleOTPLoginSuccess}
        mode="login"
      />
    </>
  );
};

export default LoginForm;
