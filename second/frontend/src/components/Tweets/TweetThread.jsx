import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useSocket from "../../hooks/useSocket.js";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";

export default function TweetThread() {
  const { tweetId } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const [rootTweet, setRootTweet] = useState(null);
  const [replies, setReplies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [socketToken, setSocketToken] = useState(null);

  useEffect(() => {
    axios.get(
      `${apiUrl}/api/v1/users/current-user`,
      { withCredentials: true }
    )
    .then(res => {
      setUser(res.data.data);
      setSocketToken(res.data.data?._id || null);
    })
    .catch(() => {
      setSocketToken(null);
    });
  }, [apiUrl]);

  const socket = useSocket(socketToken);
  const currentUserId = user?._id;

  const fetchThread = async (pageNum, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await axios.get(
        `${apiUrl}/api/v1/tweets/${tweetId}/thread?page=${pageNum}&limit=20`,
        { withCredentials: true }
      );

      const threadData = res.data?.data;
      if (threadData) {
        if (!append) {
          setRootTweet(threadData.rootTweet);
          setReplies(threadData.replies || []);
        } else {
          setReplies((prev) => {
            const existingIds = new Set(prev.map((r) => r._id));
            const filtered = (threadData.replies || []).filter((r) => !existingIds.has(r._id));
            return [...prev, ...filtered];
          });
        }
        setHasMore((threadData.replies || []).length === 20);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load thread");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchThread(1, false);
    setPage(1);
  }, [tweetId]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_tweet_room', { tweetId });

    const handleNewReply = (data) => {
      if (!data?.reply) return;
      const parentId = data.reply.parentTweet?._id?.toString()
        || data.reply.parentTweet?.toString();
      if (parentId === tweetId) {
        setReplies((prev) => {
          if (prev.some((r) => r._id === data.reply._id)) return prev;
          return [...prev, data.reply];
        });

        setRootTweet((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            replyCount: (prev.replyCount || 0) + 1
          };
        });
      }
    };

    socket.on("new_reply", handleNewReply);

    return () => {
      socket.off("new_reply", handleNewReply);
      socket.emit('leave_tweet_room', { tweetId });
    };
  }, [socket, tweetId]);

  const handleReplyPosted = (newReply) => {
    setReplies((prev) => {
      if (prev.some((r) => r._id === newReply._id)) return prev;
      return [...prev, newReply];
    });
    
    setRootTweet((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        replyCount: (prev.replyCount || 0) + 1
      };
    });
  };

  const loadMoreReplies = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchThread(nextPage, true);
  };

  if (loading && !rootTweet) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Thread</h1>
        </div>

        {error && (
          <div className="p-4 border border-red-500/30 bg-red-950/20 rounded-xl text-center">
            <p className="text-red-400 text-sm font-medium mb-3">{error}</p>
            <button
              onClick={() => fetchThread(1, false)}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {rootTweet && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden shadow-md">
            <TweetCard
              tweet={rootTweet}
              currentUserId={currentUserId}
              onQuote={() => {}}
              onRetweet={() => {}}
              onReply={() => {}}
            />

            {currentUserId && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-800/20">
                <TweetComposer
                  parentTweetId={tweetId}
                  onTweetPosted={handleReplyPosted}
                />
              </div>
            )}

            <div className="border-t border-slate-700/50 divide-y divide-slate-700/30">
              {replies.map((reply) => (
                <div key={reply._id} className="pl-4 md:pl-6 bg-slate-800/10">
                  <TweetCard
                    tweet={reply}
                    currentUserId={currentUserId}
                    onQuote={() => {}}
                    onRetweet={() => {}}
                    onReply={() => {}}
                  />
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="p-4 flex justify-center border-t border-slate-700/30">
                <button
                  onClick={loadMoreReplies}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-semibold rounded-full transition-colors"
                >
                  {loadingMore ? "Loading..." : "Load More Replies"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
