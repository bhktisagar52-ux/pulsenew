import React, { useState, useEffect, useRef } from 'react';
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
  reactions: Array<{
    user: {
      _id: string;
      username: string;
      profilePicture?: string;
    };
    emoji: string;
    reactedAt: Date;
  }>;
  createdAt: string;
  expiresAt: string;
}

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
  onView: (storyId: string) => void;
  onReact: (storyId: string) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialStoryIndex,
  onClose,
  onView,
  onReact
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [showReactions, setShowReactions] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [progress, setProgress] = useState(0);
  const [animatedEmoji, setAnimatedEmoji] = useState<string | null>(null);
  const [showAnimatedEmoji, setShowAnimatedEmoji] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const updateProgressRef = useRef<(() => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentStory = stories[currentIndex];
  const isOwnStory = user?._id === currentStory?.author._id;

  useEffect(() => {
    if (currentStory && !currentStory.views.some(view => view.user._id === user?._id)) {
      onView(currentStory._id);
    }
  }, [currentStory, user, onView]);



  useEffect(() => {
    if (currentStory?.mediaType === 'image') {
      // For images, show progress over 15 seconds using requestAnimationFrame for smooth updates
      const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const percentage = (elapsed / 15000) * 100;
        setProgress(Math.min(percentage, 100));

        if (percentage < 100) {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        } else {
          handleNext();
        }
      };
      updateProgress();
    } else if (currentStory?.mediaType === 'video' && videoRef.current) {
      const handleLoadedMetadata = () => {
        let videoDuration = videoRef.current!.duration;
        const maxDuration = 30; // 30 seconds max for videos

        // Cap video duration at 30 seconds
        if (videoDuration > maxDuration) {
          videoDuration = maxDuration;
        }

        const updateProgress = () => {
          if (videoRef.current) {
            let percentage = (videoRef.current.currentTime / videoDuration) * 100;
            setProgress(Math.min(percentage, 100));

            // Auto-advance after max duration or when video ends
            if (videoRef.current.currentTime >= videoDuration || percentage >= 100) {
              handleNext();
            }
          }
        };

        updateProgressRef.current = updateProgress;
        videoRef.current!.addEventListener('timeupdate', updateProgress);

        // Ensure video plays when loaded
        videoRef.current.play();
      };

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          if (updateProgressRef.current) {
            videoRef.current.removeEventListener('timeupdate', updateProgressRef.current);
          }
        }
      };
    }

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentIndex, currentStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      // Trigger animation
      setAnimatedEmoji(emoji);
      setShowAnimatedEmoji(true);

      // Hide animation after 1 second
      setTimeout(() => {
        setShowAnimatedEmoji(false);
        setAnimatedEmoji(null);
      }, 1000);

      await api.post(`/api/stories/${currentStory._id}/react`, { emoji });
      setShowReactions(false);
      await onReact(currentStory._id);
    } catch (error) {
      console.error('Error sending reaction:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      await api.post(`/api/stories/${currentStory._id}/reply`, { content: replyText });
      setReplyText('');
      setShowReply(false);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        handleNext();
        break;
      case 'ArrowLeft':
        handlePrev();
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  if (!currentStory) return null;

  const reactions = ['❤️', '👍', '😀', '😢', '😮', '😡', '🔥', '💯'];

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300"
      >
        ✕
      </button>

      {/* Progress Bar */}
      <div className="absolute top-2 left-2 right-2 z-10">
        <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Navigation Areas */}
      <div
        className="flex-1 cursor-pointer flex items-center justify-start pl-4"
        onClick={handlePrev}
      >
        {currentIndex > 0 && (
          <div className="bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        )}
      </div>
      <div
        className="flex-1 cursor-pointer flex items-center justify-end pr-4"
        onClick={handleNext}
      >
        {currentIndex < stories.length - 1 && (
          <div className="bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          if (clickX < width / 2) {
            handlePrev();
          } else {
            handleNext();
          }
        }}
      >
        {/* Media */}
        <div className="relative w-full h-full max-w-md mx-auto">
          {currentStory.mediaType === 'image' ? (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-cover"
              onEnded={handleNext}
            />
          )}

          {/* Author Info */}
          <div className="absolute top-12 left-4 flex items-center space-x-3">
            <img
              src={currentStory.author.profilePicture || '/default-avatar.png'}
              alt={currentStory.author.username}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div>
              <p className="text-white font-semibold">{currentStory.author.username}</p>
              <p className="text-gray-300 text-sm">
                {new Date(currentStory.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4">
              <p className="text-white text-sm bg-black bg-opacity-50 rounded-lg p-2">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            <div className="flex space-x-4">
              {/* Reply Button */}
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-white text-lg hover:scale-110 transition-transform"
              >
                💬
              </button>

              {/* Reaction Button */}
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="text-white text-lg hover:scale-110 transition-transform"
              >
                ❤️
              </button>

              {/* Viewers Button - Only show for own stories */}
              {isOwnStory && (
                <button
                  onClick={() => {
                    console.log('Current story reactions:', currentStory.reactions);
                    console.log('Current story views:', currentStory.views);
                    setShowViewers(!showViewers);
                  }}
                  className="text-white text-lg hover:scale-110 transition-transform"
                >
                  👁️
                </button>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Reply Panel */}
      {showReply && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to story..."
              className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleReply()}
            />
            <button
              onClick={handleReply}
              className="bg-blue-500 text-white rounded-full px-6 py-2 hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Reactions Panel */}
      {showReactions && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 rounded-full p-2 flex space-x-2">
          {reactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Animated Emoji */}
      {showAnimatedEmoji && animatedEmoji && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
          <div className="text-4xl animate-pulse">
            {animatedEmoji}
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      {showViewers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-black font-semibold">Viewed by</h3>
              <button
                onClick={() => setShowViewers(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {(() => {
                // Create unique viewers list
                const uniqueViewers = currentStory.views.reduce((acc, view) => {
                  if (!acc.some(v => v.user._id === view.user._id)) {
                    acc.push(view);
                  }
                  return acc;
                }, [] as typeof currentStory.views);

                return uniqueViewers.map((view) => {
                  // Find if this user reacted
                  const reaction = currentStory.reactions.find(r => r.user._id === view.user._id);

                  return (
                    <div key={view.user._id} className="flex items-center space-x-3">
                      <img
                        src={view.user.profilePicture || '/default-avatar.png'}
                        alt={view.user.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-black text-sm font-medium">{view.user.username}</p>
                          {reaction && (
                            <span className="text-lg">{reaction.emoji}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
              {currentStory.views.length === 0 && (
                <p className="text-gray-500 text-sm">No views yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
