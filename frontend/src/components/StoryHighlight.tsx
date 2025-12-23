'use client';

import React from 'react';

interface Story {
  _id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  createdAt: string;
}

interface StoryHighlightProps {
  stories: Story[];
  onStoryClick?: (story: Story) => void;
}

const StoryHighlight: React.FC<StoryHighlightProps> = ({ stories, onStoryClick }) => {
  if (stories.length === 0) {
    return (
      <div className="flex justify-center py-4">
        <div className="glass-card w-20 h-20 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white">+</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4 px-4">
      {stories.slice(0, 10).map((story) => (
        <div
          key={story._id}
          className="flex-shrink-0 glass-card w-20 h-20 rounded-full cursor-pointer hover:scale-105 transition-transform overflow-hidden"
          onClick={() => onStoryClick?.(story)}
        >
          <div className="relative w-full h-full">
            {story.mediaType === 'image' ? (
              <img
                src={story.mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={story.mediaUrl}
                className="w-full h-full object-cover"
                muted
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoryHighlight;
