import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Flag, Send, User, MessageCircle } from "lucide-react";
import Hls from "hls.js";

export default function VideoPlayer() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [subscribers, setSubscribers] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const videoRef = useRef(null);

  // Setup Hls.js playback for M3U8 adaptive streams
  useEffect(() => {
    if (!video || !videoRef.current) return;

    const videoElement = videoRef.current;
    let hls;

    if (video.videoFile && video.videoFile.includes(".m3u8")) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxMaxBufferLength: 10
        });
        hls.loadSource(video.videoFile);
        hls.attachMedia(videoElement);
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        // Native support (Safari, iOS)
        videoElement.src = video.videoFile;
      }
    } else if (video.videoFile) {
      // Fallback for legacy direct MP4 video sources
      videoElement.src = video.videoFile;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [video]);

  // COMMENTS STATE
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/${id}`, {
          withCredentials: true,
        });
        setVideo(res.data.data);

        // Fetch subscription status
        try {
          const subscriptionRes = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/status/${res.data.data.owner._id}`,
            { withCredentials: true }
          );
          setIsSubscribed(subscriptionRes.data.data.isSubscribed);
        } catch (err) {
          console.error("Error fetching subscription status", err);
        }

      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id]);

  useEffect(() => {
    if (!video) return;

    const fetchData = async () => {
      try {
        // Fetch Avatar
        const userRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/${video.owner._id}`, {
          withCredentials: true,
        });
        setAvatar(userRes.data.data.avatar);

        // Fetch Subscribers
        const subRes = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/u/${video.owner._id}`,
          { withCredentials: true }
        );
        setSubscribers(subRes.data.data.length);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchData();
  }, [video]);

  useEffect(() => {
    if (!id) return;
    const fetchComments = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/comments/${id}`,
          { withCredentials: true }
        );
        setComments(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };
    fetchComments();
  }, [id]);

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
  };

  const handleSubscribe = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/c/${video.owner._id}`,
        {},
        { withCredentials: true }
      );
      setIsSubscribed(!isSubscribed);
      setSubscribers(prev => isSubscribed ? prev - 1 : prev + 1);
    } catch (error) {
      console.error("Error toggling subscription:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/comments/${id}`,
        { content: newComment },
        { withCredentials: true }
      );

      setComments(prev => [res.data.data, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/comments/${commentId}/reply`,
        { text: replyText },
        { withCredentials: true }
      );

      setComments(prev =>
        prev.map(c =>
          c._id === commentId
            ? { ...c, replies: [...(c.replies || []), res.data.data] }
            : c
        )
      );

      setReplyText("");
      setReplyTo(null);
    } catch (error) {
      console.error("Error replying to comment:", error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );

  if (!video) return <div className="p-10 text-center text-red-500 font-bold">Video not found!</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content: Video + Info */}
      <div className="lg:col-span-2 space-y-6">

        {/* Video Player Container */}
        <div className="rounded-2xl overflow-hidden shadow-xl bg-black aspect-video relative group">
          <video
            ref={videoRef}
            poster={video.thumbnail}
            controls
            className="w-full h-full object-contain"
          />
        </div>

        {/* Video Details */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{video.title}</h1>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 border-b border-slate-200 pb-4">
            {/* Channel Info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 ring-2 ring-white shadow-sm">
                <img src={avatar || "https://via.placeholder.com/50"} alt="Channel" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{video.owner?.username}</h3>
                <p className="text-xs text-slate-500">{subscribers.toLocaleString()} subscribers</p>
              </div>

              <button
                onClick={handleSubscribe}
                className={`ml-4 px-5 py-2 rounded-full font-medium transition-all ${isSubscribed
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/20'
                  }`}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center bg-slate-100 rounded-full p-1 self-start md:self-auto">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-l-full transition-colors ${liked ? "bg-slate-200 text-slate-900 font-medium" : "hover:bg-slate-200 text-slate-600"}`}
              >
                <ThumbsUp size={18} className={liked ? "fill-current" : ""} />
                <span className="text-sm">Like</span>
              </button>
              <div className="w-px h-6 bg-slate-300"></div>
              <button
                onClick={handleDislike}
                className={`flex items-center gap-2 px-4 py-2 rounded-r-full transition-colors ${disliked ? "bg-slate-200 text-slate-900" : "hover:bg-slate-200 text-slate-600"}`}
              >
                <ThumbsDown size={18} className={disliked ? "fill-current" : ""} />
              </button>
            </div>

            <div className="flex items-center gap-2 hidden md:flex">
              <button className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700">
                <Share2 size={20} />
              </button>
              <button className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700">
                <Bookmark size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Description Box */}
        <div className="bg-slate-100/50 rounded-xl p-4 text-sm text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setShowFullDesc(!showFullDesc)}>
          <p className="font-bold mb-2 text-slate-900">
            {video.views?.toLocaleString()} views • {new Date(video.createdAt).toLocaleDateString()}
          </p>
          <p className={`whitespace-pre-line ${!showFullDesc && 'line-clamp-3'}`}>
            {video.description}
          </p>
          <button className="mt-2 font-medium text-slate-600 hover:text-slate-900">
            {showFullDesc ? "Show less" : "Show more"}
          </button>
        </div>

        {/* Comments Section (Mobile/Tablet View) */}
        <div className="lg:hidden">
          {/* ... duplicated comment logic if needed, but keeping it simple for now */}
        </div>
      </div>

      {/* Sidebar: Comments (Desktop) or Recommended Videos */}
      <div className="space-y-6">
        {/* Comment Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Comments <span className="text-slate-500 font-normal text-base">{comments.length}</span>
          </h3>
        </div>

        {/* Add Comment */}
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold flex-shrink-0">
            U
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border-b border-slate-300 focus:border-slate-800 outline-none py-2 bg-transparent text-sm transition-colors"
            />
            <div className="flex justify-end gap-2">
              <button className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-100" onClick={() => setNewComment("")}>Cancel</button>
              <button
                disabled={!newComment.trim()}
                onClick={handleAddComment}
                className="text-sm font-medium bg-brand-600 text-white px-3 py-1.5 rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comment
              </button>
            </div>
          </div>
        </div>

        {/* Comment List */}
        <div className="space-y-6 mt-6">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3 group">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                {comment.owner?.avatar ? (
                  <img src={comment.owner.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={20} className="text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">{comment.owner?.username}</span>
                  <span className="text-xs text-slate-500">2 hours ago</span>
                </div>
                <p className="text-sm text-slate-800 mt-1">{comment.content}</p>

                <div className="flex items-center gap-4 mt-2">
                  <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900">
                    <ThumbsUp size={14} /> <span>{comment.likes || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900">
                    <ThumbsDown size={14} />
                  </button>
                  <button onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)} className="text-xs font-medium text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-full">
                    Reply
                  </button>
                </div>

                {/* Reply Input */}
                {replyTo === comment._id && (
                  <div className="mt-3 flex gap-2 animate-fadeIn">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Add a reply..."
                      className="flex-1 text-sm border-b border-slate-300 focus:border-slate-800 outline-none pb-1 bg-transparent"
                      autoFocus
                    />
                    <button onClick={() => handleReply(comment._id)} className="text-brand-600 hover:bg-brand-50 p-1 rounded">
                      <Send size={16} />
                    </button>
                  </div>
                )}

                {/* Replies List */}
                {comment.replies?.length > 0 && (
                  <div className="mt-3 space-y-3 pl-3 border-l-2 border-slate-100">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs">
                          <User size={12} className="text-slate-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900">{reply.user?.username}</span>
                          </div>
                          <p className="text-sm text-slate-800">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
