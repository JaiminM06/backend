// src/App.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";



export default function Videos() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos`, {
  withCredentials: true,
});

        setVideos(res.data.data); 
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideos();
    
  }, []); 


  return (
    <main className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto">
      {videos.map((video) => (
        <div
          key={video._id}
          className="bg-white rounded-lg shadow hover:shadow-lg transition"
          onClick={() => navigate(`/Dashboard/${video._id}`)}
        >
          <img
            src={video.thumbnail}
            alt={video.title}
            className="rounded-t-lg w-full h-40 object-cover"
            
          />
          <div className="p-3">
            <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
            <p className="text-xs text-gray-500">{video.owner.username || "Unknown Channel"}</p>
            <p className="text-xs text-gray-400">{video.views} views</p>
          </div>
        </div>
        
      ))}
    </main>
  );
}
