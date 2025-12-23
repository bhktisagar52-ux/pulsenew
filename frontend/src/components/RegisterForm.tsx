'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmailVerificationModal from './EmailVerificationModal';

const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(username, email, password);
      setRegistrationSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerificationModal(false);
    // Email verified successfully
    alert('Email verified successfully! You can now login.');
  };

  const resetForm = () => {
    setRegistrationSuccess(false);
    setUsername('');
    setEmail('');
    setPassword('');
    setError(null);
  };

  if (registrationSuccess) {
    return (
      <>
        <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
          <div className="text-center">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4 text-green-600">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              Welcome to Pulse! You can now login with your credentials.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Optional: Verify Your Email</h3>
              <p className="text-sm text-blue-600 mb-3">
                Verify your email to access additional security features and ensure account recovery.
              </p>
              <button
                onClick={() => setShowVerificationModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Verify Email Now
              </button>
            </div>

            <button
              onClick={resetForm}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Register Another Account
            </button>
          </div>
        </div>

        <EmailVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          email={email}
          onSuccess={handleVerificationSuccess}
          mode="verify"
        />
      </>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
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
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </>
  );
};

export default RegisterForm;
