'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
  followers?: string[];
  following?: string[];
}

interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: {
      _id: string;
      username: string;
    };
  };
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatSidebarProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export interface ChatSidebarRef {
  refreshConversations: () => void;
}

const ChatSidebar = forwardRef<ChatSidebarRef, ChatSidebarProps>(({ onSelectConversation, selectedConversationId }, ref) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchConversations();
    fetchSuggestedUsers();
  }, []);

  // Initialize Socket.io connection for real-time updates
  useEffect(() => {
    if (user) {
      // Initialize socket connection
      socketRef.current = io('https://pulsenew-l909.onrender.com', {
        transports: ['websocket', 'polling']
      });

      // Join user's room for real-time message updates
      socketRef.current.emit('join', user._id);

      // Listen for new messages
      socketRef.current.on('newMessage', (data: { conversationId: string; message: any }) => {
        // Update conversations when a new message arrives
        setConversations(prevConversations => {
          return prevConversations.map(conversation => {
            if (conversation._id === data.conversationId) {
              // Update the conversation with the new message
              const updatedConversation = {
                ...conversation,
                lastMessage: {
                  content: data.message.content,
                  createdAt: data.message.createdAt,
                  sender: data.message.sender
                },
                lastMessageAt: new Date().toISOString()
              };

              // If the message is not from the current user, increment unread count
              if (data.message.sender._id !== user._id) {
                updatedConversation.unreadCount = (conversation.unreadCount || 0) + 1;
              }

              return updatedConversation;
            }
            return conversation;
          }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        });
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      // Fetch all conversations - don't filter by follow status
      const response = await api.get('/api/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    setUsersLoading(true);
    try {
      // Fetch current user data
      const userResponse = await api.get('/api/auth/me');
      const currentUser = userResponse.data.user;

      // Get users that current user follows
      const followingResponse = await api.get(`/api/auth/user/${currentUser._id}/following`);
      const followingUsers = followingResponse.data.following || [];

      // Get users that follow current user
      const followersResponse = await api.get(`/api/auth/user/${currentUser._id}/followers`);
      const followerUsers = followersResponse.data.followers || [];

      // Find mutual follows (users that current user follows AND who follow current user back)
      const mutualUsers = followingUsers.filter((followingUser: User) =>
        followerUsers.some((followerUser: User) => followerUser._id === followingUser._id)
      );

      setSuggestedUsers(mutualUsers);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const startConversation = async (userId: string) => {
    try {
      // Use the get-or-create endpoint to get or create a conversation
      // Note: backend chat routes are under /api/chat, so update the endpoint accordingly
      const response = await api.post('/api/chat/conversations/get-or-create', { otherUserId: userId });
      const newConversation = response.data;

      // Refresh conversations to include the new one
      await fetchConversations();

      // Select the new conversation
      onSelectConversation(newConversation);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleConversationClick = async (conversation: Conversation) => {
    // Mark messages as read if there are unread messages
    if (conversation.unreadCount > 0) {
      try {
        await api.put(`/api/chat/conversations/${conversation._id}/mark-read`);
        // Update the conversation in state to reflect read status
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv._id === conversation._id
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }

    // Select the conversation
    onSelectConversation(conversation);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    // Assuming current user is the first participant for now
    // In a real app, you'd get current user from auth context
    return conversation.participants[1] || conversation.participants[0];
  };

  useImperativeHandle(ref, () => ({
    refreshConversations: fetchConversations
  }));

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4">
            <div className="text-center text-gray-500 mb-4">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start chatting with someone!</p>
            </div>
            {usersLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestedUsers.length > 0 ? (
              <div className="px-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Suggested for you</h4>
                <div className="space-y-1">
                  {suggestedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => startConversation(user._id)}
                    >
                      <div className="relative">
                        <img
                          src={user.profilePicture || '/default-avatar.png'}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">Start a conversation</p>
                      </div>
                      <button className="text-blue-500 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p className="text-sm">Follow some users to start chatting!</p>
              </div>
            )}
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            const isSelected = conversation._id === selectedConversationId;

            return (
              <div
                key={conversation._id}
                onClick={() => handleConversationClick(conversation)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={otherUser.profilePicture || '/default-avatar.png'}
                      alt={otherUser.username}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-semibold truncate ${
                        conversation.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-900'
                      }`}>
                        {otherUser.username}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage ? (
                      <p className={`text-sm truncate mt-0.5 ${
                        conversation.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-600'
                      }`}>
                        {conversation.lastMessage.sender._id === user?._id ? `You: ${conversation.lastMessage.content}` : conversation.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-0.5">No messages yet</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
