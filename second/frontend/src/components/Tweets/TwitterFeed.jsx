import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";

export default function TwitterFeed(props) {
  let context = {};
  try {
    context = useOutletContext() || {};
  } catch (e) {}

  const socket = props.socket || context.socket;
  const currentUserId = props.currentUserId || context.currentUserId;
  const [tweets, setTweets] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quoteTweetId, setQuoteTweetId] = useState(null);

  const loaderRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchTweets = async (pageNum, replace = false) => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${apiUrl}/api/v1/tweets/feed?page=${pageNum}&limit=20`,
        { withCredentials: true }
      );
      
      const feedData = res.data?.data;
      const newTweets = feedData?.tweets || [];
      
      if (replace) {
        setTweets(newTweets);
      } else {
        setTweets((prev) => {
          const existingIds = new Set(prev.map((t) => t._id));
          const filtered = newTweets.filter((t) => !existingIds.has(t._id));
          return [...prev, ...filtered];
        });
      }
      
      setHasMore(newTweets.length === 20);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tweets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets(1, true);
    setPage(1);
  }, []);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchTweets(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, loading]);

  useEffect(() => {
    if (!socket) return;

    const handleNewTweet = (data) => {
      if (data?.tweet) {
        setTweets((prev) => {
          if (prev.some((t) => t._id === data.tweet._id)) return prev;
          return [data.tweet, ...prev];
        });
      }
    };

    socket.on("new_tweet", handleNewTweet);

    return () => {
      socket.off("new_tweet", handleNewTweet);
    };
  }, [socket]);

  const handleTweetPosted = (newTweet) => {
    setTweets((prev) => [newTweet, ...prev]);
    setQuoteTweetId(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {currentUserId && (
        <div className="mb-4">
          <TweetComposer 
            onTweetPosted={handleTweetPosted} 
            quoteTweetId={quoteTweetId}
          />
          {quoteTweetId && (
            <div className="mt-2 flex justify-end">
              <button 
                onClick={() => setQuoteTweetId(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Cancel Quote
              </button>
            </div>
          )}
        </div>
      )}

      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
        {tweets.map((tweet) => (
          <TweetCard
            key={tweet._id}
            tweet={tweet}
            currentUserId={currentUserId}
            variant="light"
            onQuote={(id) => setQuoteTweetId(id)}
            onRetweet={() => {}}
            onReply={() => {}}
          />
        ))}
      </div>

      {loading && (
        <div className="py-8 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {!loading && tweets.length === 0 && !error && (
        <div className="text-center py-12 px-4 border border-slate-100 rounded-xl bg-white shadow-sm">
          <p className="text-slate-500 text-sm font-medium">
            No tweets yet. Follow people or be the first to tweet!
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 border border-red-100 bg-red-50 rounded-xl text-center shadow-sm">
          <p className="text-red-600 text-sm font-medium mb-3">{error}</p>
          <button
            onClick={() => fetchTweets(page, tweets.length === 0)}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {hasMore && !loading && <div ref={loaderRef} className="h-4" />}
    </div>
  );
}
