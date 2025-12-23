import React, { useState } from 'react';
import api from '../utils/api';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess: (token: string, user: any) => void;
  mode: 'verify' | 'login'; // verify for signup verification, login for OTP login
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onSuccess,
  mode
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleSendOTP = async () => {
    setResendLoading(true);
    setMessage('');

    try {
      const endpoint = mode === 'verify' ? '/api/auth/send-verification-otp' : '/api/auth/send-login-otp';
      await api.post(endpoint, { email });
      setMessage('OTP sent to your email successfully!');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setMessage('Please enter the OTP');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (mode === 'verify') {
        // Verify email for signup
        await api.post('/api/auth/verify-email', { email, otp });
        setMessage('Email verified successfully! You can now login.');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Login with OTP
        const response = await api.post('/api/auth/login-with-otp', { email, otp });
        onSuccess(response.data.token, response.data.user);
        onClose();
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOtp('');
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {mode === 'verify' ? 'Verify Your Email' : 'Login with OTP'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-gray-300 mb-2">
              {mode === 'verify'
                ? 'Please verify your email address to complete registration.'
                : 'Enter your email to receive a login OTP.'
              }
            </p>
            <p className="text-sm text-gray-400">Email: {email}</p>
          </div>

          {mode === 'login' && (
            <button
              onClick={handleSendOTP}
              disabled={resendLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {resendLoading ? 'Sending...' : 'Send OTP'}
            </button>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter 6-digit OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-center text-lg tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          {message && (
            <div className={`text-sm ${message.includes('success') || message.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Verifying...' : mode === 'verify' ? 'Verify' : 'Login'}
            </button>

            {mode === 'verify' && (
              <button
                onClick={handleSendOTP}
                disabled={resendLoading}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
              >
                {resendLoading ? 'Sending...' : 'Resend'}
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 text-center">
            OTP expires in 10 minutes
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
