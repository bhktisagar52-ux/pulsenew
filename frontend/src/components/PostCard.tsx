'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
}

interface Comment {
  _id: string;
  content: string;
  author: User;
  createdAt: string;
  likes: string[];
}

interface Post {
  _id: string;
  postType: 'post' | 'reel';
  content: string;
  image?: string;
  author: User;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
}

/** ✅ Normalize media URL (handles localhost + production) */
const getMediaUrl = (media?: string) => {
  if (!media) return '';
  return media.startsWith('http')
    ? media.replace('http://localhost:5000', API_URL)
    : `${API_URL}/uploads/${media}`;
};

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onComment,
}) => {
  const router = useRouter();
  const { user, followUser, unfollowUser } = useAuth();

  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (post.author._id === currentUserId) return;
    if (user?.following) {
      setIsFollowing(user.following.includes(post.author._id));
    }
  }, [post.author._id, currentUserId, user]);

  useEffect(() => {
    if (user?.savedPosts) {
      setIsSaved(user.savedPosts.includes(post._id));
    }
  }, [post._id, user]);

  const handleFollow = async () => {
    if (followLoading) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowLoading(true);

    try {
      prev ? await unfollowUser(post.author._id) : await followUser(post.author._id);
    } catch {
      setIsFollowing(prev);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await api.post(`/api/posts/${post._id}/like`);
      onLike(post._id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setLoading(true);
    try {
      await api.post(`/api/posts/${post._id}/comments`, {
        content: commentContent,
      });
      onComment(post._id, commentContent);
      setCommentContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.post(`/api/posts/${post._id}/save`);
      setIsSaved(res.data.isSaved);
    } catch (e) {
      console.error(e);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(
      window.location.origin + `/posts/${post._id}`
    );
    setShowShareOptions(false);
  };

  const isLiked = post.likes.includes(currentUserId);

  return (
    <div className="glass-card p-4 mb-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push(`/profile/${post.author._id}`)}
        >
          <img
            src={post.author.profilePicture || '/default-avatar.png'}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <h3 className="text-white font-semibold">
              {post.author.username}
            </h3>
            <p className="text-gray-400 text-sm">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {post.author._id !== currentUserId && !isFollowing && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm"
          >
            {followLoading ? '...' : 'Follow'}
          </button>
        )}
      </div>

      {/* CONTENT */}
      <p className="text-gray-200 mb-2">{post.content}</p>

      {post.image && (
        <div className="mt-2">
          {post.postType === 'reel' ? (
            !videoError ? (
              <video
                src={getMediaUrl(post.image)}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[600px] rounded-lg object-cover"
                style={{ aspectRatio: '9/16' }}
                onError={() => setVideoError(true)}
              />
            ) : (
              <img
                src={getMediaUrl(post.image)}
                className="w-full max-h-[600px] rounded-lg object-cover"
              />
            )
          ) : (
            <img
              src={getMediaUrl(post.image)}
              className="w-full max-h-96 rounded-lg object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex justify-between border-t border-gray-700 pt-3 mt-3">
        <div className="flex space-x-4">
          <button onClick={handleLike} className={isLiked ? 'text-red-500' : 'text-gray-400'}>
            ❤️ {post.likes.length}
          </button>

          <button
            onClick={() => router.push(`/comments/${post._id}`)}
            className="text-gray-400"
          >
            💬 {post.comments.length}
          </button>

          <button onClick={handleSave}>
            {isSaved ? '🔖' : '📑'}
          </button>
        </div>

        <div className="relative">
          <button onClick={() => setShowShareOptions(!showShareOptions)}>📤</button>
          {showShareOptions && (
            <div className="absolute right-0 bg-gray-800 rounded mt-2">
              <button onClick={copyLink} className="px-4 py-2 text-sm">
                Copy Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
