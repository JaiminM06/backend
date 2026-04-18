import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Play } from "lucide-react";

export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const videosRes = await axios.get(
          `\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/feed`,
          { withCredentials: true }
        );
        setVideos(videosRes.data.data || []);
      } catch (err) {
        console.error("Error loading videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-slate-200 rounded-xl aspect-video mb-3"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {videos.map((video, index) => (
        <div
          key={video._id}
          className="group cursor-pointer flex flex-col gap-3"
          onClick={() => navigate(`/Home/${video._id}`)}
        >
          {/* Thumbnail Container */}
          <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 shadow-sm group-hover:shadow-md transition-all duration-300">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-black/30 backdrop-blur-sm p-3 rounded-full">
                <Play size={24} className="text-white fill-white" />
              </div>
            </div>
            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-1.5 py-0.5 rounded">
              {/* Generate consistent duration based on video ID length or index */}
              {
                video.duration
                  ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60)
                    .toString()
                    .padStart(2, '0')}`
                  : `${(index % 10) + 5}:${((index * 3) % 60)
                    .toString()
                    .padStart(2, '0')}`
              }
            </div>
          </div>

          {/* Video Info */}
          <div className="flex gap-3 px-1">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={video.owner?.avatar || `https://ui-avatars.com/api/?name=${video.owner?.username}&background=random`}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border border-white shadow-sm"
              />
            </div>

            <div className="flex flex-col">
              <h3 className="font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors">
                {video.title}
              </h3>
              <p className="text-slate-500 text-sm mt-1 hover:text-slate-700 w-fit">
                {video.owner?.username || "Unknown Channel"}
              </p>
              <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                <span>{video.views} views</span>
                <span>•</span>
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


