'use client';

import React, { useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ReelItem({ reel, isActive }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  /* ---------------- AUTOPLAY ---------------- */

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  /* ---------------- TAB VISIBILITY ---------------- */

  useEffect(() => {
    const handleVisibility = () => {
      if (!videoRef.current) return;
      document.hidden ? videoRef.current.pause() : isActive && videoRef.current.play();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive]);

  /* ---------------- LIKE ---------------- */

  const likeReel = async () => {
    setLiked(true);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    await api.put(`/api/posts/${reel._id}/like`);
  };

  /* ---------------- DOUBLE TAP ---------------- */

  let lastTap = 0;
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) likeReel();
    lastTap = now;
  };

  return (
    <div
      onClick={handleTap}
      className="relative h-full w-full flex items-center justify-center bg-black"
    >
      <video
        ref={videoRef}
        src={`${API_URL}/${reel.image}`}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />

      {/* Heart */}
      {showHeart && (
        <div className="absolute text-white text-7xl animate-ping">❤️</div>
      )}

      {/* Controls */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-6 text-white">
        <button onClick={likeReel} className="text-3xl">
          {liked ? '❤️' : '🤍'}
        </button>
        <button onClick={() => setMuted(!muted)} className="text-2xl">
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Caption */}
      <div className="absolute bottom-6 left-4 text-white max-w-[70%]">
        <p className="font-semibold">@{reel.author.username}</p>
        <p className="text-sm opacity-90">{reel.content}</p>
      </div>
    </div>
  );
}
