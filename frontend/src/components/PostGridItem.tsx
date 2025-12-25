'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/** ✅ Normalize media URL (handles localhost + production) */
const getMediaUrl = (media?: string) => {
  if (!media) return '';
  if (media.startsWith('http')) {
    // Replace localhost with current protocol/host for dynamic handling
    return media.replace('http://localhost:5000', `${window.location.protocol}//${window.location.host}`);
  }
  // For relative paths, use current protocol/host
  return `${window.location.protocol}//${window.location.host}/uploads/${media}`;
};

interface Post {
  _id: string;
  postType: 'post' | 'reel';
  content: string;
  image?: string;
  likes: string[];
  comments: any[];
}

interface PostGridItemProps {
  post: Post;
}

const PostGridItem: React.FC<PostGridItemProps> = ({ post }) => {
  const router = useRouter();

  const handleClick = () => {
    if (post.postType === 'post') {
      router.push(`/posts/${post._id}`);
    } else if (post.postType === 'reel') {
      router.push(`/reels/${post._id}`);
    }
  };

  return (
    <div
      className="glass-card aspect-square cursor-pointer overflow-hidden hover:scale-105 transition-transform duration-200"
      onClick={handleClick}
    >
      <div className="relative w-full h-full">
        {post.image ? (
          post.postType === 'reel' ? (
            <video
              src={getMediaUrl(post.image)}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <img
              src={getMediaUrl(post.image)}
              alt="Post"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          post.postType === 'reel' ? (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
              <div className="text-white text-4xl">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center p-4">
              <p className="text-white text-sm text-center line-clamp-3">
                {post.content}
              </p>
            </div>
          )
        )}

        {/* Overlay for stats */}
        <div className="absolute  hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 flex space-x-4 text-white">
            <div className="flex items-center space-x-1">
              <span>❤️</span>
              <span>{post.likes.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💬</span>
              <span>{post.comments.length}</span>
            </div>
          </div>
        </div>

        {/* Play icon for reels */}
        {post.postType === 'reel' && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostGridItem;
