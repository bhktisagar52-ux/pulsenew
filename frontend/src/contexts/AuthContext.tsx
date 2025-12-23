'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/utils/api';

interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  followers: string[];
  following: string[];
  savedPosts: string[];
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and user on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/register', { username, email, password });
      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      logout();
    }
  };

  const followUser = async (userId: string) => {
    try {
      console.log('Following user:', userId);
      const response = await api.post('/api/auth/follow', { userId });
      console.log('Follow response:', response.data);
      await refreshUser();
      console.log('User data refreshed after follow');
    } catch (error: any) {
      console.error('Follow error:', error.response?.data || error.message);
      throw error;
    }
  };

  const unfollowUser = async (userId: string) => {
    try {
      console.log('Unfollowing user:', userId);
      const response = await api.post('/api/auth/unfollow', { userId });
      console.log('Unfollow response:', response.data);
      await refreshUser();
      console.log('User data refreshed after unfollow');
    } catch (error: any) {
      console.error('Unfollow error:', error.response?.data || error.message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    followUser,
    unfollowUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
