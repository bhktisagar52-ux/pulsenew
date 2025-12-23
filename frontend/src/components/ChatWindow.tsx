'use client';

import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import api from '../utils/api';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
}

interface Message {
  _id: string;
  sender: User;
  content: string;
  messageType?: string;
  storyReply?: {
    storyId: string;
    storyThumbnail: string;
    storyAuthor: string;
  };
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  lastMessageAt: string;
}

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUserId: string;
  onMessageSent?: () => void;
  onMessagesRead?: () => void;
}

export default function ChatWindow({ conversation, currentUserId, onMessageSent }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.io connection
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('https://pulsenew-l909.onrender.com', {
      transports: ['websocket', 'polling']
    });

    // Join user's room for real-time messages
    socketRef.current.emit('join', currentUserId);

    // Listen for new messages
    socketRef.current.on('newMessage', (data: { conversationId: string; message: Message }) => {
      if (conversation && data.conversationId === conversation._id) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg._id === data.message._id);
          if (!messageExists) {
            return [...prev, data.message];
          }
          return prev;
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUserId, conversation]);

  const fetchMessages = async () => {
    if (!conversation) return;

    try {
      const response = await api.get(`/api/chat/conversations/${conversation._id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversation) return;

    try {
      await api.put(`/api/chat/conversations/${conversation._id}/mark-read`);
      onMessagesRead?.();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation || !newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await api.post(`/api/chat/conversations/${conversation._id}/messages`, {
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherParticipant = () => {
    if (!conversation) return null;
    return conversation.participants.find(p => p._id !== currentUserId);
  };

  if (!conversation) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-light text-gray-900 mb-2">Your Messages</h3>
          <p className="text-gray-500 text-sm leading-relaxed">Send private messages to your friends and connections</p>
        </div>
      </div>
    );
  }

  const otherUser = getOtherParticipant();

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Chat Header - Instagram Style */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={otherUser?.profilePicture || '/default-avatar.png'}
                alt={otherUser?.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{otherUser?.username}</h3>
              <p className="text-xs text-gray-500">Active now</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages - Instagram Style */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => {
                const isCurrentUser = message.sender._id === currentUserId;
                const showAvatar = !isCurrentUser && (index === 0 || messages[index - 1].sender._id !== message.sender._id);

                return (
                  <div
                    key={message._id}
                    className={`flex items-end space-x-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCurrentUser && showAvatar && (
                      <img
                        src={message.sender.profilePicture || '/default-avatar.png'}
                        alt={message.sender.username}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    {!isCurrentUser && !showAvatar && <div className="w-6 flex-shrink-0" />}
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {message.messageType === 'story_reply' && message.storyReply ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                            <img
                              src={message.storyReply.storyThumbnail}
                              alt="Story reply"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Replied to story</p>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      )}
                    </div>
                    {isCurrentUser && <div className="w-6 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Instagram Style */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message..."
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15m-3-3h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || loading}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
