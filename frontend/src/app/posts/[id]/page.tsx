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

const PostPage: React.FC = () => {
  const params = useParams();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get(
          `${API_URL}/api/posts/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setPost(response.data);
      } catch (err) {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (loading) {
    return <div>Loading post...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {post.author.username}&apos;s Post
      </h1>

      {post.image && (
  <img
    src={post.image}
    alt="Post"
    className="w-full rounded-lg shadow-md mb-4"
    loading="lazy"
  />
)}


      <p className="mb-4">{post.content}</p>

      <div className="flex space-x-4">
        <span>❤️ {post.likes.length}</span>
        <span>💬 {post.comments.length}</span>
      </div>

      {/* Comments and other interactions can be added here */}
    </div>
  );
};

export default PostPage;
