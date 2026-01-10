import { useState,useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";  

export default function Feed(){
    const [videos, setVideos] = useState([]);
    const navigate = useNavigate();
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        
        const videosRes = await axios.get(
          `http://localhost:8000/api/v1/videos/feed`,
          { withCredentials: true }
        );
        setVideos(videosRes.data.data || []);
      } catch (err) {
        console.error("Error loading videos:", err);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {videos.map((video) => (
        <div key={video._id} className="bg-white rounded-lg shadow-md overflow-hidden" onClick={() => navigate(`/Home/${video._id}`)} >
          <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
          <div className="p-4">
            <h3 className="font-bold text-lg">{video.title}</h3>
            <p className="text-gray-600">{video.description}</p>
            <p className="text-gray-500 text-sm">Views: {video.views}</p>
          </div>
        </div>
      ))}
    </div>
  );
}


