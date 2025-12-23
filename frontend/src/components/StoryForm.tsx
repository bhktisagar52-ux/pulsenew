import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface StoryFormProps {
  onStoryCreated: () => void;
  onClose: () => void;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  preview: string;
}

const StoryForm: React.FC<StoryFormProps> = ({ onStoryCreated, onClose }) => {
  const { user } = useAuth();
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'edit' | 'music'>('upload');

  // Text and emoji features
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Music features
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [musicTracks] = useState<MusicTrack[]>([
    { id: '1', name: 'Happy Vibes', artist: 'Summer Beats', duration: 30, preview: '🎵' },
    { id: '2', name: 'Chill Mode', artist: 'Relax Sounds', duration: 25, preview: '🎼' },
    { id: '3', name: 'Epic Moment', artist: 'Action Tracks', duration: 35, preview: '🎶' },
    { id: '4', name: 'Love Story', artist: 'Romance Music', duration: 28, preview: '💖' },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setMediaType('image');
      }

      setCurrentStep('edit');
    }
  };

  const addText = () => {
    const newText: TextElement = {
      id: Date.now().toString(),
      text: 'Tap to edit',
      x: 50,
      y: 50,
      fontSize: 24,
      color: '#ffffff',
      fontFamily: 'Arial'
    };
    setTextElements([...textElements, newText]);
    setSelectedTextId(newText.id);
  };

  const addEmoji = (emoji: string) => {
    const newText: TextElement = {
      id: Date.now().toString(),
      text: emoji,
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
      fontSize: 40,
      color: '#ffffff',
      fontFamily: 'Arial'
    };
    setTextElements([...textElements, newText]);
  };

  const updateText = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(text =>
      text.id === id ? { ...text, ...updates } : text
    ));
  };

  const deleteText = (id: string) => {
    setTextElements(textElements.filter(text => text.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, textId: string) => {
    const text = textElements.find(t => t.id === textId);
    if (!text) return;

    setDragging(true);
    setSelectedTextId(textId);
    setDragOffset({
      x: e.clientX - text.x,
      y: e.clientY - text.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !selectedTextId) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    updateText(selectedTextId, { x: Math.max(0, Math.min(x, rect.width - 100)), y: Math.max(0, Math.min(y, rect.height - 50)) });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleSubmit = async () => {
    if (!mediaFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('media', mediaFile);
      formData.append('mediaType', mediaType);

      // Add text overlays as JSON
      if (textElements.length > 0) {
        formData.append('textOverlays', JSON.stringify(textElements));
      }

      // Add music selection
      if (selectedMusic) {
        formData.append('musicTrack', selectedMusic.id);
      }

      const response = await api.post('/api/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        onStoryCreated();
        onClose();
      }
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const emojis = ['😀', '❤️', '👍', '🔥', '🎉', '✨', '🌟', '💫', '🎈', '🎊', '🎵', '🎶', '💖', '💕', '💯', '🙌'];

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-80 p-4 flex justify-between items-center z-10">
        <button
          onClick={onClose}
          className="text-white text-2xl hover:text-gray-300"
        >
          ✕
        </button>
        <div className="flex space-x-4">
          {currentStep === 'edit' && (
            <button
              onClick={() => setCurrentStep('music')}
              className="text-white px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Music
            </button>
          )}
          {currentStep === 'music' && (
            <button
              onClick={() => setCurrentStep('edit')}
              className="text-white px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700"
            >
              Back to Edit
            </button>
          )}
          {(currentStep === 'edit' || currentStep === 'music') && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-white px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share Story'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full h-full max-w-md mx-auto relative">
        {currentStep === 'upload' && (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Story</h2>
              <p className="text-gray-300">Share a photo or video with your friends</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="media-upload"
            />

            <label
              htmlFor="media-upload"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Choose from Gallery
            </label>
          </div>
        )}

        {(currentStep === 'edit' || currentStep === 'music') && previewUrl && (
          <div
            ref={containerRef}
            className="relative w-full h-full bg-black overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Media Preview */}
            {mediaType === 'image' ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={previewUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
              />
            )}

            {/* Text Overlays */}
            {textElements.map((textElement) => (
              <div
                key={textElement.id}
                className={`absolute cursor-move select-none ${
                  selectedTextId === textElement.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  left: textElement.x,
                  top: textElement.y,
                  fontSize: textElement.fontSize,
                  color: textElement.color,
                  fontFamily: textElement.fontFamily,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                }}
                onMouseDown={(e) => handleMouseDown(e, textElement.id)}
                onDoubleClick={() => setSelectedTextId(textElement.id)}
              >
                {textElement.text}
                {selectedTextId === textElement.id && (
                  <button
                    onClick={() => deleteText(textElement.id)}
                    className="ml-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Edit Controls */}
            {currentStep === 'edit' && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 p-4">
                <div className="flex justify-center space-x-4 mb-4">
                  <button
                    onClick={addText}
                    className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30"
                  >
                    Add Text
                  </button>
                </div>

                {/* Emoji Picker */}
                <div className="flex flex-wrap justify-center gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Music Selection */}
            {currentStep === 'music' && (
              <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col">
                <div className="p-4">
                  <h3 className="text-white text-xl font-bold mb-4">Choose Music</h3>
                  <div className="space-y-3">
                    {musicTracks.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => setSelectedMusic(track)}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedMusic?.id === track.id
                            ? 'bg-blue-600'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <div className="text-2xl">{track.preview}</div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{track.name}</div>
                          <div className="text-gray-400 text-sm">{track.artist}</div>
                        </div>
                        <div className="text-gray-400 text-sm">{track.duration}s</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default StoryForm;
