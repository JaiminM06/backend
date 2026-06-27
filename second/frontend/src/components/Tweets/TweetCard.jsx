import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { formatTimeAgo } from "../../utils/formatTimeAgo";
import TweetComposer from "./TweetComposer";

export default function TweetCard({
  tweet,
  currentUserId,
  onRetweet,
  onReply,
  onQuote,
  variant = "dark",
}) {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const displayTweet = tweet.isRetweet && tweet.originalTweet ? tweet.originalTweet : tweet;

  const [liked, setLiked] = useState(!!tweet.likedByCurrentUser);
  const [localLikeCount, setLocalLikeCount] = useState(tweet.likeCount || 0);
  const [localRetweetCount, setLocalRetweetCount] = useState(displayTweet.retweetCount || 0);
  const [retweeted, setRetweeted] = useState(false);
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  const isLight = variant === "light";

  const t = {
    cardBg: isLight ? "bg-white" : "bg-slate-800",
    cardHover: isLight ? "hover:bg-[#F7F9FA]" : "hover:bg-slate-700/50",
    borderB: isLight ? "border-b border-[#EFF3F4]" : "border-b border-slate-700",
    ink: isLight ? "text-[#0F1419]" : "text-white",
    muted: isLight ? "text-[#536471]" : "text-slate-400",
    secondary: isLight ? "text-[#536471]" : "text-slate-500",
    avatarBorder: isLight ? "border border-[#EFF3F4]" : "border border-slate-600",
    content: isLight ? "text-[#0F1419]" : "text-slate-200",
    quoteBorder: isLight ? "border border-[#EFF3F4]" : "border border-slate-600",
    quoteBg: isLight ? "hover:bg-[#F7F9FA]" : "hover:bg-slate-700/50",
    quoteText: isLight ? "text-[#536471]" : "text-slate-300",
    replyBorder: isLight ? "border-l border-[#EFF3F4]" : "border-l border-slate-700",
    mediaBorder: isLight ? "border border-[#EFF3F4]" : "border border-slate-600",
    retweetHeader: isLight ? "text-[#536471]" : "text-slate-400",
    actionHoverReply: isLight ? "group-hover:bg-blue-50" : "group-hover:bg-blue-900/30",
    actionHoverRetweet: isLight ? "group-hover:bg-green-50" : "group-hover:bg-green-900/30",
    actionHoverLike: isLight ? "group-hover:bg-pink-50" : "group-hover:bg-pink-900/30",
    actionHoverQuote: isLight ? "group-hover:bg-blue-50" : "group-hover:bg-blue-900/30",
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    const originalLiked = liked;
    const originalLikeCount = localLikeCount;

    setLiked(!originalLiked);
    setLocalLikeCount(originalLiked ? Math.max(0, originalLikeCount - 1) : originalLikeCount + 1);

    try {
      await axios.post(
        `${apiUrl}/api/v1/likes/tweet/${displayTweet._id}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      setLiked(originalLiked);
      setLocalLikeCount(originalLikeCount);
    }
  };

  const handleRetweetClick = async (e) => {
    e.stopPropagation();
    const originalRetweeted = retweeted;
    const originalRetweetCount = localRetweetCount;

    setRetweeted(!originalRetweeted);
    setLocalRetweetCount(
      originalRetweeted ? Math.max(0, originalRetweetCount - 1) : originalRetweetCount + 1
    );

    try {
      const res = await axios.post(
        `${apiUrl}/api/v1/tweets/${displayTweet._id}/retweet`,
        {},
        { withCredentials: true }
      );
      if (res.data?.data) {
        setRetweeted(res.data.data.retweeted);
      }
      if (onRetweet) onRetweet(displayTweet._id);
    } catch (err) {
      setRetweeted(originalRetweeted);
      setLocalRetweetCount(originalRetweetCount);
    }
  };

  const handleReplyPosted = (newReply) => {
    setShowReplyComposer(false);
    if (onReply) onReply(newReply);
  };

  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/((?:#|@)[\w]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("#")) {
        const cleanTag = part.slice(1);
        return (
          <span
            key={idx}
            className="text-blue-500 hover:underline cursor-pointer font-medium"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/Home/search?q=${encodeURIComponent(cleanTag)}`);
            }}
          >
            {part}
          </span>
        );
      } else if (part.startsWith("@")) {
        const cleanUser = part.slice(1);
        return (
          <span
            key={idx}
            className="text-blue-500 hover:underline cursor-pointer font-medium"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/Home/user/${cleanUser}`);
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const media = displayTweet.media || [];
  const mediaCount = media.length;
  let gridClass = "";
  if (mediaCount === 1) gridClass = "grid-cols-1";
  else if (mediaCount === 2) gridClass = "grid-cols-2";
  else gridClass = "grid-cols-2 grid-rows-2";

  return (
    <div
      onClick={() => navigate(`/Home/tweet/${displayTweet._id}`)}
      className={`${t.cardBg} ${t.cardHover} ${t.borderB} p-4 transition-colors cursor-pointer block`}
    >
      {tweet.isRetweet && (
        <div className={`flex items-center gap-2 text-xs font-semibold mb-2 pl-10 ${t.retweetHeader}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6.89M9 11l3 3 3-3" />
          </svg>
          <span>@{tweet.owner?.username} retweeted</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/Home/user/${displayTweet.owner?.username}`);
          }}
        >
          <img
            src={
              displayTweet.owner?.avatar ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"
            }
            alt={displayTweet.owner?.username}
            className={`w-10 h-10 rounded-full object-cover ${t.avatarBorder} hover:opacity-90 transition-opacity`}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-1.5 text-sm mb-1 flex-wrap ${t.muted}`}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/Home/user/${displayTweet.owner?.username}`);
              }}
              className={`font-bold ${t.ink} hover:underline cursor-pointer`}
            >
              {displayTweet.owner?.fullName || displayTweet.owner?.username}
            </span>
            <span>@{displayTweet.owner?.username}</span>
            <span className={t.secondary}>·</span>
            <span className={`text-xs ${t.secondary}`}>{formatTimeAgo(displayTweet.createdAt)}</span>
          </div>

          <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${t.content}`}>
            {renderContent(displayTweet.content)}
          </p>

          {/* Media Grid */}
          {media.length > 0 && (
            <div
              className={`grid ${gridClass} gap-2 mt-3 rounded-xl overflow-hidden ${t.mediaBorder} aspect-[16/9]`}
            >
              {media.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />
              ))}
            </div>
          )}

          {/* Quote Tweet */}
          {displayTweet.quoteTweet && (
            <div
              className={`mt-3 p-3 rounded-xl ${t.quoteBorder} ${t.quoteBg} transition-colors cursor-pointer`}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/Home/tweet/${displayTweet.quoteTweet._id}`);
              }}
            >
              <div className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${t.ink}`}>
                <span>@{displayTweet.quoteTweet.owner?.username || "user"}</span>
              </div>
              <p className={`text-xs line-clamp-3 leading-relaxed ${t.quoteText}`}>
                {displayTweet.quoteTweet.content?.length > 100
                  ? `${displayTweet.quoteTweet.content.substring(0, 100)}...`
                  : displayTweet.quoteTweet.content}
              </p>
            </div>
          )}

          {/* Action Bar */}
          <div className={`flex items-center justify-between mt-4 max-w-md ${t.muted}`}>
            {/* Reply Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReplyComposer(!showReplyComposer);
              }}
              className="flex items-center gap-1.5 group hover:text-blue-500 transition-colors"
            >
              <span className={`p-2 rounded-full ${t.actionHoverReply} transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </span>
              <span className="text-xs">{displayTweet.replyCount || 0}</span>
            </button>

            {/* Retweet Button */}
            <button
              onClick={handleRetweetClick}
              className={`flex items-center gap-1.5 group transition-colors ${
                retweeted ? "text-green-500" : "hover:text-green-500"
              }`}
            >
              <span className={`p-2 rounded-full ${t.actionHoverRetweet} transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6.89M9 11l3 3 3-3"
                  />
                </svg>
              </span>
              <span className="text-xs">{localRetweetCount}</span>
            </button>

            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 group transition-colors ${
                liked ? "text-pink-500" : "hover:text-pink-500"
              }`}
            >
              <span className={`p-2 rounded-full ${t.actionHoverLike} transition-colors`}>
                {liked ? (
                  <svg className="w-4 h-4 fill-current text-pink-500" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                )}
              </span>
              <span className="text-xs">{localLikeCount}</span>
            </button>

            {/* Quote / Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onQuote) onQuote(displayTweet._id);
              }}
              className="flex items-center gap-1.5 group hover:text-blue-500 transition-colors"
            >
              <span className={`p-2 rounded-full ${t.actionHoverQuote} transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 10.742l-2.084 1.25m2.084-1.25a2.5 2.5 0 113.536 3.536 2.5 2.5 0 01-3.536-3.536zm8.684 2.516l-2.084-1.25m2.084 1.25a2.5 2.5 0 113.536 3.536 2.5 2.5 0 01-3.536-3.536z"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Reply Composer */}
      {showReplyComposer && (
        <div
          className={`mt-3 pl-12 ${t.replyBorder}`}
          onClick={(e) => e.stopPropagation()}
        >
          <TweetComposer parentTweetId={displayTweet._id} onTweetPosted={handleReplyPosted} />
        </div>
      )}
    </div>
  );
}
