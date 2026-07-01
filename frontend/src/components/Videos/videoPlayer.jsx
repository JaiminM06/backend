import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ThumbsUp, ThumbsDown, Share2, Bookmark, User } from "lucide-react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import { formatTimeAgo } from "../../utils/formatTimeAgo.js";

export default function VideoPlayer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [subscribers, setSubscribers] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const videoRef = useRef(null);

  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const hasEndedRef = useRef(false);
  const sourceRef = useRef("direct");

  // QUALITY SELECTION STATE
  const [levels, setLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState("Auto");
  const [hlsInstance, setHlsInstance] = useState(null);

  // COMMENTS STATE
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentFocused, setCommentFocused] = useState(false);

  // RELATED VIDEOS STATE
  const [relatedVideos, setRelatedVideos] = useState([]);

  // LOCAL LIKE COUNT
  const [localLikeCount, setLocalLikeCount] = useState(0);

  useEffect(() => {
    const validSources = ['direct', 'search', 'recommended', 'external'];
    const urlSource = searchParams.get('source');
    sourceRef.current = validSources.includes(urlSource) ? urlSource : 'direct';
  }, [searchParams]);

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
        setHlsInstance(hls);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLevels(hls.levels || []);
        });
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
      setHlsInstance(null);
      setLevels([]);
      setCurrentQuality("Auto");
    };
  }, [video]);

  const handleQualityChange = (e) => {
    const value = e.target.value;
    setCurrentQuality(value);

    if (!hlsInstance) return;

    if (value === "Auto") {
      hlsInstance.currentLevel = -1; // -1 represents auto quality selection in HLS.js
    } else {
      const levelIndex = parseInt(value, 10);
      hlsInstance.currentLevel = levelIndex;
    }
  };

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/${id}`, {
          withCredentials: true,
        });
        setVideo(res.data.data);
        setLocalLikeCount(res.data.data.likeCount || res.data.data.likes || 0);
        setLiked(!!res.data.data.isLiked);

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
        setSubscribers(subRes.data.data?.total || 0);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchData();
  }, [video?._id]);

  useEffect(() => {
    if (!id) return;
    const fetchComments = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/comments/${id}`,
          { withCredentials: true }
        );
        setComments(res.data.data?.comments || []);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };
    fetchComments();
  }, [id]);

  // Fetch recommendations or fallback videos
  useEffect(() => {
    if (!id) return;
    const fetchRelated = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/recommendations/${id}`,
          { withCredentials: true }
        );
        const data = res.data.data || [];
        if (data.length > 0) {
          setRelatedVideos(data);
        } else {
          const fallbackRes = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos`,
            { params: { limit: 10 }, withCredentials: true }
          );
          setRelatedVideos(fallbackRes.data.data?.videos || fallbackRes.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching recommendations, fetching fallback videos:", err);
        try {
          const fallbackRes = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos`,
            { params: { limit: 10 }, withCredentials: true }
          );
          setRelatedVideos(fallbackRes.data.data?.videos || fallbackRes.data.data || []);
        } catch (fallbackErr) {
          console.error("Error fetching fallback videos:", fallbackErr);
        }
      }
    };
    fetchRelated();
  }, [id]);

  const handleLike = async () => {
    const originalLiked = liked;
    const originalDisliked = disliked;
    const originalLikeCount = localLikeCount;

    setLiked(!originalLiked);
    setLocalLikeCount(prev => originalLiked ? Math.max(0, prev - 1) : prev + 1);
    if (originalDisliked) setDisliked(false);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/likes/toggle/v/${id}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error('Error toggling like:', err);
      // Rollback
      setLiked(originalLiked);
      setLocalLikeCount(originalLikeCount);
      setDisliked(originalDisliked);
    }
  };

  const handleDislike = async () => {
    const originalLiked = liked;
    const originalDisliked = disliked;
    const originalLikeCount = localLikeCount;

    if (originalLiked) {
      setLiked(false);
      setLocalLikeCount(prev => Math.max(0, prev - 1));
    }
    setDisliked(!originalDisliked);

    try {
      if (originalLiked) {
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/likes/toggle/v/${id}`,
          {},
          { withCredentials: true }
        );
      }
    } catch (err) {
      console.error('Error toggling dislike:', err);
      // Rollback
      setLiked(originalLiked);
      setLocalLikeCount(originalLikeCount);
      setDisliked(originalDisliked);
    }
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

  const handleEnded = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    const watchDuration = Math.floor(currentTimeRef.current);
    const totalDuration = Math.floor(durationRef.current);

    if (totalDuration <= 0) return;

    axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/analytics/watch-event`,
      {
        videoId: id,
        watchDuration,
        totalDuration,
        source: sourceRef.current,
        deviceType: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop'
      },
      { withCredentials: true }
    ).catch(err => console.error("Failed to record watch event:", err));
  };

  useEffect(() => {
    const currentVideoId = id;
    const currentSource = sourceRef.current;

    currentTimeRef.current = 0;
    durationRef.current = 0;
    hasEndedRef.current = false;

    return () => {
      if (hasEndedRef.current) return;

      const watchDuration = Math.floor(currentTimeRef.current);
      const totalDuration = Math.floor(durationRef.current);

      if (totalDuration <= 0) return;

      axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/analytics/watch-event`,
        {
          videoId: currentVideoId,
          watchDuration,
          totalDuration,
          source: currentSource,
          deviceType: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop'
        },
        { withCredentials: true }
      ).catch(err => console.error("Failed to record unmount watch event:", err));
    };
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#0F0F0F] min-h-screen">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 animate-pulse">
          <div className="bg-[#272727] w-full aspect-video rounded-xl" />
          <div className="bg-[#272727] h-6 w-3/4 rounded mt-3" />
          <div className="flex justify-between items-center mt-3 border-b border-[#272727] pb-4">
            <div className="bg-[#272727] h-4 w-1/4 rounded" />
            <div className="bg-[#272727] h-8 w-1/4 rounded-full" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-[#272727]" />
            <div className="space-y-2 flex-1">
              <div className="bg-[#272727] h-4 w-1/3 rounded" />
              <div className="bg-[#272727] h-3 w-1/5 rounded" />
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="hidden lg:block space-y-3 animate-pulse">
          <div className="bg-[#272727] h-4 w-1/4 rounded mb-4" />
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="flex gap-2 p-2">
              <div className="w-[168px] h-[94px] rounded-lg bg-[#272727] flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="bg-[#272727] h-3 w-full rounded" />
                <div className="bg-[#272727] h-3 w-5/6 rounded" />
                <div className="bg-[#272727] h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!video) return <div className="p-10 text-center text-red-500 font-bold bg-[#0F0F0F] min-h-screen">Video not found!</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0F0F0F] min-h-screen p-6"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Video Player + Info + Comments) */}
        <div className="lg:col-span-2 space-y-6 flex-1 min-w-0">
          
          {/* Video Player Container */}
          <div className="relative bg-black w-full aspect-video rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              poster={video.thumbnail}
              controls
              onEnded={handleEnded}
              onTimeUpdate={(e) => { currentTimeRef.current = e.target.currentTime; }}
              onLoadedMetadata={(e) => { durationRef.current = e.target.duration; }}
              className="w-full h-full"
            />
          </div>

          {/* Quality Selector */}
          {levels.length > 0 && (
            <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#272727] px-4 py-2.5 rounded-xl text-sm font-medium text-[#AAAAAA] shadow-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00BA7C] animate-pulse"></span>
                Adaptive Streaming Active
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[#AAAAAA]">Quality:</span>
                <select
                  value={currentQuality}
                  onChange={handleQualityChange}
                  className="bg-[#272727] border border-[#383838] rounded-lg px-2 py-1 outline-none text-white font-medium cursor-pointer hover:border-[#AAAAAA] transition-colors"
                >
                  <option value="Auto">Auto</option>
                  {levels.map((level, index) => (
                    <option key={index} value={index}>
                      {level.height ? `${level.height}p` : `Variant ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Video Info Section */}
          <div>
            <h1 className="text-white text-xl font-semibold leading-tight mt-3">
              {video.title}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-3 border-b border-[#272727] pb-4">
              <span className="text-[#AAAAAA] text-sm">
                {(video.views ?? 0).toLocaleString()} views • {formatDate(video.createdAt)}
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <motion.button
                  whileTap={{ scale: 1.3 }}
                  animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    liked
                      ? 'bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/40'
                      : 'bg-[#272727] text-white hover:bg-[#383838]'
                  }`}
                >
                  👍 {localLikeCount}
                </motion.button>

                <button
                  onClick={handleDislike}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    disliked
                      ? 'bg-white/20 text-[#FF0000] border border-white/10'
                      : 'bg-[#272727] text-white hover:bg-[#383838]'
                  }`}
                >
                  👎
                </button>

                <button className="bg-[#272727] text-white hover:bg-[#383838] rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5">
                  <Share2 size={16} /> Share
                </button>

                <button className="bg-[#272727] text-white hover:bg-[#383838] rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5">
                  <Bookmark size={16} /> Save
                </button>
              </div>
            </div>

            {/* Channel Info Row */}
            <div className="flex items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <img
                  src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.owner?.username || "U")}&background=random`}
                  alt="Channel"
                  className="w-10 h-10 rounded-full object-cover bg-[#272727]"
                />
                <div>
                  <h3 className="text-white font-medium text-sm">
                    {video.owner?.username}
                  </h3>
                  <p className="text-[#AAAAAA] text-xs">
                    {subscribers.toLocaleString()} subscribers
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleSubscribe}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isSubscribed
                    ? 'bg-[#272727] text-white border border-[#383838] hover:bg-[#383838]'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </motion.button>
            </div>

            {/* Collapsible Description Box */}
            <div
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="bg-[#272727] rounded-xl p-3 mt-3 text-[#AAAAAA] text-sm cursor-pointer hover:bg-[#323232] transition-colors"
            >
              <p className={`whitespace-pre-line leading-relaxed ${!showFullDesc ? 'line-clamp-3' : ''}`}>
                {video.description}
              </p>
              <button className="text-white font-medium mt-1 hover:underline">
                {showFullDesc ? "Show less" : "Show more"}
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-4">
            <h3 className="text-white font-medium text-lg mb-4">
              {comments.length} Comments
            </h3>

            {/* Comment Input Row */}
            <div className="flex gap-3 items-start mb-6">
              <div className="w-9 h-9 rounded-full bg-[#272727] text-white flex items-center justify-center font-bold flex-shrink-0">
                U
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onFocus={() => setCommentFocused(true)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="w-full bg-transparent border-b border-[#272727] text-white placeholder-[#606060] text-sm resize-none focus:border-[#AAAAAA] outline-none pb-2 transition-colors"
                />
                {commentFocused && (
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setNewComment("");
                        setCommentFocused(false);
                      }}
                      className="px-4 py-1.5 text-white hover:bg-white/10 rounded-full text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!newComment.trim()}
                      onClick={async () => {
                        await handleAddComment();
                        setCommentFocused(false);
                      }}
                      className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-3 py-1">
                  <img
                    src={comment.owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.owner?.username || "U")}&background=random`}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover bg-[#272727]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white text-sm">
                        @{comment.owner?.username || "user"}
                      </span>
                      <span className="text-[#606060] text-xs">
                        · {comment.createdAt ? formatTimeAgo(comment.createdAt) : ""}
                      </span>
                    </div>
                    <p className="text-[#AAAAAA] text-sm leading-relaxed mt-1 whitespace-pre-line">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <button className="flex items-center gap-1.5 text-[#AAAAAA] text-xs hover:text-white transition-colors">
                        👍 {comment.likes || 0}
                      </button>
                      <button className="text-[#AAAAAA] text-xs hover:text-white transition-colors">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-[#606060] text-sm text-center py-6">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Related Videos Sidebar) */}
        <div className="hidden lg:block space-y-4">
          <h3 className="text-white font-medium text-sm mb-3">Up next</h3>
          
          <div className="space-y-3">
            {relatedVideos.map((item) => (
              <motion.div
                key={item._id}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                className="flex gap-2 p-2 rounded-xl cursor-pointer transition-colors"
                onClick={() => navigate(`/youtube/watch/${item._id}`)}
              >
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-[168px] h-[94px] rounded-lg object-cover flex-shrink-0 bg-[#272727]"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-xs font-medium line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[#AAAAAA] text-xs mt-1 truncate">
                    {item.owner?.username || "Unknown Channel"}
                  </p>
                  <p className="text-[#AAAAAA] text-xs mt-0.5 truncate">
                    {(item.views ?? 0).toLocaleString()} views • {formatTimeAgo(item.createdAt)}
                  </p>
                </div>
              </motion.div>
            ))}

            {relatedVideos.length === 0 && (
              <p className="text-[#606060] text-xs py-4 text-center">
                No related videos found.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
