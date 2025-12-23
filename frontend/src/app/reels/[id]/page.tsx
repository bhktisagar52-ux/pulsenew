'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface Post {
  _id: string;
  content: string;
  image?: string;
  postType: 'post' | 'reel';
  likes: string[];
  comments: any[];
  author: {
    username: string;
    profilePicture?: string;
  };
}

const ReelPage: React.FC = () => {
  const params = useParams();
  const reelId = params.id;

  const [reel, setReel] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReel = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token'); // Adjust if token stored differently
        const response = await axios.get(`http://localhost:5000/api/posts/${reelId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setReel(response.data);
      } catch (err) {
        setError('Failed to load reel');
      } finally {
        setLoading(false);
      }
    };

    if (reelId) {
      fetchReel();
    }
  }, [reelId]);

  if (loading) {
    return <div>Loading reel...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!reel) {
    return <div>Reel not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{reel.author.username}'s Reel</h1>
      <video
        src={reel.image}
        controls
        className="w-full rounded-lg shadow-md"
      />
      <p className="mt-4">{reel.content}</p>
      <div className="mt-4 flex space-x-4">
        <span>❤️ {reel.likes.length}</span>
        <span>💬 {reel.comments.length}</span>
      </div>
      {/* Comments and other interactions can be added here */}
    </div>
  );
};

export default ReelPage;
