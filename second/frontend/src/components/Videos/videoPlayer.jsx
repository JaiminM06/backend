import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ThumbsUp, ThumbsDown, Share2, Bookmark, User, MessageCircle } from "lucide-react";
import Hls from "hls.js";

export default function VideoPlayer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
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

  // COMMENTS STATE
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

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
  }, [video?._id]);

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

  const handleLike = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/likes/toggle/v/${id}`,
        {},
        { withCredentials: true }
      );
      setLiked(prev => !prev);
      if (disliked) setDisliked(false);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleDislike = async () => {
    try {
      // backend has no dislike — just remove like if liked
      if (liked) {
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/likes/toggle/v/${id}`,
          {},
          { withCredentials: true }
        );
        setLiked(false);
      }
      setDisliked(prev => !prev);
    } catch (err) {
      console.error('Error toggling dislike:', err);
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
            onEnded={handleEnded}
            onTimeUpdate={(e) => { currentTimeRef.current = e.target.currentTime; }}
            onLoadedMetadata={(e) => { durationRef.current = e.target.duration; }}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Quality Selector */}
        {levels.length > 0 && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 shadow-sm">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              Adaptive Streaming Active
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Quality:</span>
              <select
                value={currentQuality}
                onChange={handleQualityChange}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1 outline-none text-slate-800 font-semibold cursor-pointer shadow-sm hover:border-slate-400 transition-colors"
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

      {/* Sidebar: Comments (Desktop) */}
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
                  <span className="text-xs text-slate-500">
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })
                      : ''}
                  </span>
                </div>
                <p className="text-sm text-slate-800 mt-1">{comment.content}</p>

                <div className="flex items-center gap-4 mt-2">
                  <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900">
                    <ThumbsUp size={14} /> <span>{comment.likes || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900">
                    <ThumbsDown size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
