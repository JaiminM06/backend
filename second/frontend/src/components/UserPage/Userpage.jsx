import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Mail, Calendar, Users, Video, Settings, LogOut, Play } from "lucide-react";

function UserPage() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch current user details
        const userRes = await axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/current-user`, {
          withCredentials: true,
        });
        setUser(userRes.data.data);

        const profile = await axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/c/${userRes.data.data.username}`, {
          withCredentials: true,
        });
        setUserProfile(profile.data.data);

        // Fetch user's videos
        const videosRes = await axios.get(
          `\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/`,
          { withCredentials: true }
        );
        setVideos(videosRes.data.data || []);
      } catch (err) {
        console.error("Error loading user page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/logout`, {}, {
        withCredentials: true,
      });
      navigate("/");
    } catch (error) {
      console.log("Logout Unsuccessful");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-medium">
        Failed to load user details. Please login again.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Cover Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-brand-600 to-indigo-800 relative">
        {user.coverImage && (
          <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover opacity-50" />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-6">

          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
              <img
                src={user.avatar || "https://via.placeholder.com/150"}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">{userProfile?.username}</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">{userProfile?.email}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-brand-600" />
                <span className="font-semibold text-slate-900">{userProfile?.subscribersCount}</span> Subscribers
              </div>
              <div className="flex items-center gap-1.5">
                <Video size={16} className="text-brand-600" />
                <span className="font-semibold text-slate-900">{videos.length}</span> Videos
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-brand-600" />
                Joined {new Date(user.createdAt).toDateString()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={() => navigate("/Home/ManageAccount")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              <Settings size={18} /> Manage Account
            </button>
            <button
              onClick={() => navigate("/Home/ManageVideos")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              <Video size={18} /> Manage Videos
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Content Tabs / Sections */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Video className="text-brand-600" /> Uploaded Videos
          </h2>

          {videos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-100">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">You haven’t uploaded any videos yet.</p>
              <button
                onClick={() => navigate("/Home/uploadVideo")}
                className="mt-4 text-brand-600 font-semibold hover:underline"
              >
                Upload your first video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <div
                  key={video._id}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer border border-slate-100"
                  onClick={() => navigate(`/Home/${video._id}`)}
                >
                  <div className="relative aspect-video bg-slate-200 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg">
                        <Play size={20} className="text-brand-600 fill-brand-600 ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-medium">
                      <span>{video.views} views</span>
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserPage;
