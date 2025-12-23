'use client';

import React, { useState, useRef } from 'react';
import api from '../utils/api';

interface PostFormProps {
  onPostCreated: () => void;
}

const PostForm: React.FC<PostFormProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [postType, setPostType] = useState<'post' | 'reel'>('post');

  const handlePostTypeChange = (newType: 'post' | 'reel') => {
    setPostType(newType);
  };
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImage(''); // Clear URL input when file is selected
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('postType', postType);

      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setContent('');
      setImage('');
      setMediaFile(null);
      setPreviewUrl('');
      setPostType('post');
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Create Post</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 flex space-x-4">
          <label className="flex items-center space-x-2 text-white">
            <input
              type="radio"
              name="postType"
              value="post"
              checked={postType === 'post'}
              onChange={() => handlePostTypeChange('post')}
              disabled={loading}
              className="accent-blue-500"
            />
            <span>Post</span>
          </label>
          <label className="flex items-center space-x-2 text-white">
            <input
              type="radio"
              name="postType"
              value="reel"
              checked={postType === 'reel'}
              onChange={() => handlePostTypeChange('reel')}
              disabled={loading}
              className="accent-blue-500"
            />
            <span>Reel</span>
          </label>
        </div>

        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            required
            disabled={loading}
          />
        </div>

        {/* File Upload Section */}
        <div className="mb-4">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 bg-gray-800">
            <input
              ref={fileInputRef}
              type="file"
              accept={postType === 'reel' ? 'video/*' : 'image/*'}
              onChange={handleFileSelect}
              className="hidden"
              id="media-upload"
              disabled={loading}
            />
            <label
              htmlFor="media-upload"
              className="cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-gray-200 transition-colors"
            >
              <div className="text-2xl mb-2">📁</div>
              <div className="text-sm">
                {postType === 'reel' ? 'Upload a video for your reel' : 'Upload an image for your post'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Click to browse or drag and drop
              </div>
            </label>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mt-3 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Preview:</span>
                <button
                  type="button"
                  onClick={removeMedia}
                  className="text-red-500 hover:text-red-400 text-sm transition-colors"
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
              {postType === 'reel' ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          disabled={loading || !content.trim()}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
};

export default PostForm;
