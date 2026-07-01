import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import UpdateVideo from "./UpdateVideo.jsx";

export default function ManageVideos() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/videos/`,
        { withCredentials: true }
      );
      setVideos(res.data.data?.videos || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedVideo) {
      fetchVideos();
    }
  }, [selectedVideo]);

  // Delete a video
  const handleDelete = async (videoId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this video?");
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/videos/${videoId}`,
        { withCredentials: true }
      );
      setVideos(videos.filter((v) => v._id !== videoId));
    } catch (error) {
      console.error(error);
      alert("Failed to delete video. Please try again.");
    }
  };

  // Toggle publish status
  const handleTogglePublish = async (videoId) => {
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/videos/toggle/publish/${videoId}`,
        {},
        { withCredentials: true }
      );
      // Toggle local state
      setVideos(
        videos.map((v) =>
          v._id === videoId ? { ...v, isPublished: !v.isPublished } : v
        )
      );
    } catch (error) {
      console.error("Error toggling publish status:", error);
      alert("Failed to toggle publish status.");
    }
  };

  // Render Edit Screen if a video is selected
  if (selectedVideo) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0F0F0F] min-h-screen p-6"
      >
        <div className="max-w-2xl mx-auto">
          <UpdateVideo videoId={selectedVideo} goBack={() => setSelectedVideo(null)} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0F0F0F] min-h-screen p-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white text-2xl font-bold">Your Videos</h1>
        <button
          onClick={() => navigate("/youtube/upload")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF0000] text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
        >
          + Upload Video
        </button>
      </div>

      {/* Video Content list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#FF0000]" size={32} />
        </div>
      ) : videos.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 flex flex-col items-center justify-center">
          <p className="text-[#AAAAAA] text-lg font-medium mb-4">No videos yet</p>
          <button
            onClick={() => navigate("/youtube/upload")}
            className="px-6 py-2.5 bg-[#FF0000] text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Upload Video
          </button>
        </div>
      ) : (
        /* Video list Table */
        <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl overflow-hidden">
          {videos.map((video) => (
            <motion.div
              key={video._id}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              className="flex items-center justify-between gap-4 p-4 border-b border-[#1F1F1F] flex-wrap sm:flex-nowrap"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Thumbnail */}
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-[120px] h-[67px] object-cover rounded-lg bg-[#272727] shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-white text-sm font-medium truncate" title={video.title}>
                    {video.title}
                  </h3>
                  <p className="text-[#AAAAAA] text-xs mt-1">
                    {(video.views ?? 0).toLocaleString()} views •{" "}
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-auto sm:ml-0 shrink-0">
                {/* Status badge */}
                {video.isPublished ? (
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    Published
                  </span>
                ) : (
                  <span className="bg-[#272727] text-[#AAAAAA] border border-[#383838] rounded-full px-2.5 py-0.5 text-xs font-medium">
                    Private
                  </span>
                )}

                {/* Action buttons (right side) */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedVideo(video._id)}
                    className="text-[#AAAAAA] hover:text-white text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTogglePublish(video._id)}
                    className="text-[#AAAAAA] hover:text-white text-sm font-medium transition-colors"
                  >
                    Toggle publish
                  </button>
                  <button
                    onClick={() => handleDelete(video._id)}
                    className="text-[#AAAAAA] hover:text-red-400 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
