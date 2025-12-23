'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
}

interface Comment {
  _id: string;
  content: string;
  author: User;
  createdAt: string;
  likes: string[];
  replies: Comment[];
  post?: string;
}

interface CommentsPageProps {
  params: Promise<{
    postId: string;
  }>;
}

const CommentItem: React.FC<{ comment: Comment; level: number; postId: string }> = ({ comment, level, postId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const { token } = useAuth();

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    try {
      await api.post(`/api/posts/${postId}/comments`, {
        content: replyContent,
        parentComment: comment._id,
      });
      setReplyContent('');
      setShowReplyForm(false);
      // Refresh the page to show new reply
      window.location.reload();
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  return (
    <div className="comment-item" style={{ marginLeft: level * 20, marginTop: 10 }}>
      <div className="flex items-center space-x-2">
        {comment.author?.profilePicture ? (
          <img src={comment.author.profilePicture} alt="avatar" className="w-8 h-8 rounded-full border-2 border-blue-500" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {comment.author?.username?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        <span className="font-semibold text-white">{comment.author?.username || 'Unknown'}</span>
        <span className="text-gray-400 text-sm">{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
      <p className="ml-10 mt-1 text-gray-200">{comment.content}</p>
      <button
        className="reply-button ml-10"
        onClick={() => setShowReplyForm(!showReplyForm)}
      >
        Reply
      </button>
      {showReplyForm && (
        <div className="reply-form ml-10">
          <textarea
            className="w-full border rounded p-2"
            rows={2}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
          />
          <button
            className="mt-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:from-blue-600 hover:to-purple-700"
            onClick={handleReplySubmit}
          >
            Submit Reply
          </button>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          <button
            className="reply-toggle-button"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? 'Hide Replies' : 'Show Replies'}
          </button>
          {showReplies && (
            <div className="animate-fadeIn">
              {comment.replies.map((reply) => (
                <CommentItem key={reply._id} comment={reply} level={level + 1} postId={postId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CommentsPage: React.FC<CommentsPageProps> = ({ params }) => {
  const [postId, setPostId] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setPostId(resolvedParams.postId);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    if (!postId) return;

    const fetchComments = async () => {
      try {
        const response = await api.get(`/api/posts/${postId}/comments`);
        // Ensure comments have proper author data
        const commentsWithAuthors = response.data.map((comment: any) => ({
          ...comment,
          author: comment.author || { username: 'Unknown', profilePicture: '' },
          replies: comment.replies || [],
        }));
        setComments(commentsWithAuthors);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleNewCommentSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post(`/api/posts/${postId}/comments`, { content: newComment });
      setNewComment('');
      // Refresh comments after new comment
      const response = await api.get(`/api/posts/${postId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading comments...</div>;
  }

  return (
    <div className="glass-card p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Comments</h2>
      {user ? (
        <div className="mb-4">
          <textarea
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white resize-none"
            rows={3}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:from-blue-600 hover:to-purple-700 transition-all"
            onClick={handleNewCommentSubmit}
          >
            Post Comment
          </button>
        </div>
      ) : (
        <p className="text-white">Please log in to post comments.</p>
      )}
      <div>
        {comments.length === 0 ? (
          <p className="text-gray-400">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => <CommentItem key={comment._id} comment={comment} level={0} postId={postId} />)
        )}
      </div>
      <button
        className="mt-6 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        onClick={() => router.back()}
      >
        Back
      </button>
    </div>
  );
};

export default CommentsPage;
