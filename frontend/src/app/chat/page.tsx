'use client';

import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChatSidebar from '../../components/ChatSidebar';
import ChatWindow from '../../components/ChatWindow';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
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

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const sidebarRef = useRef<{ refreshConversations: () => void } | null>(null);

  if (!user) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please log in to chat</h2>
          <p className="text-gray-600">You need to be logged in to access the chat feature.</p>
        </div>
      </div>
    );
  }

  const handleMessageSent = () => {
    // Refresh sidebar conversations when a message is sent
    if (sidebarRef.current) {
      sidebarRef.current.refreshConversations();
    }
  };

  const handleMessagesRead = () => {
    // Refresh sidebar conversations when messages are read
    if (sidebarRef.current) {
      sidebarRef.current.refreshConversations();
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      <ChatSidebar
        ref={sidebarRef}
        onSelectConversation={setSelectedConversation}
        selectedConversationId={selectedConversation?._id}
      />
      <ChatWindow
        conversation={selectedConversation}
        currentUserId={user._id}
        onMessageSent={handleMessageSent}
        onMessagesRead={handleMessagesRead}
      />
    </div>
  );
}
