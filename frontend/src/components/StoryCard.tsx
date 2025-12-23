import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface Story {
  _id: string;
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  mediaType: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  views: Array<{
    user: {
      _id: string;
      username: string;
      profilePicture?: string;
    };
    viewedAt: Date;
  }>;
  createdAt: string;
  expiresAt: string;
}

interface StoryCardProps {
  story: Story;
  storyIndex: number;
  onView: (storyId: string) => void;
  onDelete: (storyId: string) => void;
  onOpenViewer: (storyIndex: number) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, storyIndex, onView, onDelete, onOpenViewer }) => {
  const { user } = useAuth();
  const [isViewed, setIsViewed] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    // Check if current user has viewed this story
    const hasViewed = story.views.some(view => view.user._id === user?._id);
    setIsViewed(hasViewed);
  }, [story.views, user]);

  const handleView = async () => {
    if (!isViewed) {
      try {
        await api.post(`/api/stories/${story._id}/view`);
        setIsViewed(true);
        onView(story._id);
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        await api.delete(`/stories/${story._id}`);
        onDelete(story._id);
      } catch (error) {
        console.error('Error deleting story:', error);
      }
    }
  };

  const isOwnStory = user?._id === story.author._id;

  return (
    <div
      className={`relative rounded-full overflow-hidden cursor-pointer transition-all duration-200 ${
        isViewed ? 'ring-2 ring-gray-300' : 'ring-2 ring-blue-500'
      }`}
      onClick={() => onOpenViewer(storyIndex)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Story Media */}
      <div className="w-20 h-20 bg-gray-200 relative">
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

        {/* Author Avatar Overlay */}
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full p-0.5">
          <img
            src={story.author.profilePicture || '/default-avatar.png'}
            alt={story.author.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        {/* Delete Button for Own Stories */}
        {isOwnStory && showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Author Name */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
        <p className="text-white text-xs font-medium truncate">
          {story.author.username}
        </p>
      </div>
    </div>
  );
};

export default StoryCard;
