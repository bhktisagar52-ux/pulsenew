'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../utils/api';
import ReelItem from './ReelItem';
import { useAuth } from '../contexts/AuthContext';

interface Reel {
  _id: string;
  image: string;
  content: string;
  likes: string[];
  comments: any[];
  author: any;
}

export default function ReelsFeed() {
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  /* ---------------- FETCH ---------------- */

  const fetchReels = useCallback(async () => {
    if (!hasMore) return;

    const { data } = await api.get(`/api/posts/reels?page=${page}&limit=10`);
    setReels(prev => [...prev, ...data.reels]);
    setHasMore(data.pagination.hasMore);
    setPage(p => p + 1);
  }, [page, hasMore]);

  useEffect(() => {
    if (user) fetchReels();
  }, [user]);

  /* ---------------- OBSERVER ---------------- */

  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveIndex(index);

            if (index >= reels.length - 3) fetchReels();
          }
        });
      },
      { root: containerRef.current, threshold: 0.65 }
    );

    Array.from(containerRef.current.children).forEach(el =>
      observerRef.current?.observe(el)
    );

    return () => observerRef.current?.disconnect();
  }, [reels]);

  /* ---------------- SCROLL ---------------- */

  const scrollTo = (index: number) => {
    containerRef.current?.scrollTo({
      top: index * window.innerHeight,
      behavior: 'smooth',
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.deltaY > 0
      ? scrollTo(Math.min(activeIndex + 1, reels.length - 1))
      : scrollTo(Math.max(activeIndex - 1, 0));
  };

  /* ---------------- UI ---------------- */

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
    >
      {reels.map((reel, index) => (
        <div
          key={reel._id}
          data-index={index}
          className="h-screen snap-center"
        >
          <ReelItem
            reel={reel}
            isActive={index === activeIndex}
          />
        </div>
      ))}
    </div>
  );
}
