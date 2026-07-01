import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, LogOut, Settings, Video } from "lucide-react";
import { motion } from "framer-motion";
import { formatDuration } from "../../utils/formatDuration.js";

function UserPage() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState("Videos");

  const navigate = useNavigate();
  const { username } = useParams();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch current user details
        const userRes = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/current-user`,
          { withCredentials: true }
        );
        setUser(userRes.data.data);

        // Determine which username's profile to view (defaults to own profile)
        const targetUsername = (!username || username === "me") ? userRes.data.data.username : username;

        const profile = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/c/${targetUsername}`,
          { withCredentials: true }
        );
        setUserProfile(profile.data.data);

        // If not own channel, check subscription status
        if (profile.data.data && profile.data.data._id !== userRes.data.data._id) {
          try {
            const subRes = await axios.get(
              `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/status/${profile.data.data._id}`,
              { withCredentials: true }
            );
            setIsSubscribed(subRes.data.data?.isSubscribed || false);
          } catch (subErr) {
            console.error("Error fetching subscription status:", subErr);
          }
        }

        // Fetch target user's videos (pass target channel user ID to feed query)
        const videosRes = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos`,
          {
            params: { userId: profile.data.data._id },
            withCredentials: true
          }
        );
        setVideos(videosRes.data.data?.videos || []);
      } catch (err) {
        console.error("Error loading user page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  const handleSubscribeToggle = async () => {
    if (!userProfile) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/c/${userProfile._id}`,
        {},
        { withCredentials: true }
      );
      setIsSubscribed(!isSubscribed);
      setUserProfile((prev) => ({
        ...prev,
        subscribersCount: prev.subscribersCount + (isSubscribed ? -1 : 1),
      }));
    } catch (err) {
      console.error("Error toggling subscription:", err);
      alert("Failed to update subscription. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/logout`,
        {},
        { withCredentials: true }
      );
      navigate("/login");
    } catch {
      console.error("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
        <Loader2 className="animate-spin text-[#FF0000]" size={36} />
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-red-500 font-medium">
        Failed to load user details. Please try logging in again.
      </div>
    );
  }

  const isOwnChannel = userProfile?.username === user?.username;
  const coverUrl = userProfile?.coverImage || user?.coverImage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0F0F0F] min-h-screen pb-12"
    >
      {/* Channel Banner */}
      <div className="relative">
        <div className="w-full h-[200px] bg-[#272727]">
          {coverUrl && (
            <img
              src={coverUrl}
              alt="Channel Banner"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <img
          src={userProfile?.avatar || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.username || "U")}&background=random`}
          alt="Channel Avatar"
          className="absolute bottom-[-32px] left-6 w-[80px] h-[80px] rounded-full border-4 border-[#0F0F0F] object-cover bg-[#1A1A1A]"
        />
      </div>

      {/* Channel Info */}
      <div className="px-6 pb-6 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-2 gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">
              {userProfile?.fullName || userProfile?.username}
            </h1>
            <p className="text-[#AAAAAA] text-sm">@{userProfile?.username}</p>
            <p className="text-[#AAAAAA] text-sm mt-1">
              {(userProfile?.subscribersCount ?? 0).toLocaleString()} subscribers • {videos.length} videos
            </p>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {isOwnChannel ? (
              <>
                <button
                  onClick={() => navigate("/youtube/dashboard")}
                  className="border border-[#383838] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#272727] transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate("/youtube/manage")}
                  className="border border-[#383838] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#272727] transition-colors flex items-center gap-1.5"
                >
                  <Video size={14} /> Videos
                </button>
                <button
                  onClick={() => navigate("/youtube/settings")}
                  className="border border-[#383838] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#272727] transition-colors flex items-center gap-1.5"
                >
                  <Settings size={14} /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-4 py-2.5 text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                >
                  <LogOut size={14} /> Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleSubscribeToggle}
                className={`rounded-full px-6 py-2.5 font-medium transition-colors text-sm ${
                  isSubscribed
                    ? "bg-[#272727] text-white border border-[#383838] hover:bg-[#383838]"
                    : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-8 border-b border-[#272727] px-6">
        {["Videos", "About"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab ? "text-white" : "text-[#AAAAAA] hover:text-white"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="channelTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF0000]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-6">
        {activeTab === "Videos" ? (
          videos.length === 0 ? (
            <div className="text-center py-20 text-[#606060]">
              <p className="text-lg font-medium">No videos uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {videos.map((video) => (
                <motion.article
                  key={video._id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.15 }}
                  className="group cursor-pointer flex flex-col gap-3"
                  onClick={() => navigate(`/youtube/watch/${video._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/youtube/watch/${video._id}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#1A1A1A]">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex gap-3 px-0.5">
                    <img
                      src={userProfile?.avatar || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.username || "U")}&background=random`}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-[#272727] shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-[#AAAAAA] text-xs mt-1 truncate">
                        {userProfile?.username}
                      </p>
                      <p className="text-[#606060] text-xs mt-0.5">
                        {(video.views ?? 0).toLocaleString()} views
                        <span className="mx-1">•</span>
                        {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )
        ) : (
          /* About Section */
          <div className="text-[#AAAAAA] space-y-6 max-w-2xl">
            <div>
              <h3 className="text-white text-lg font-semibold mb-2">Description</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {userProfile?.description || "No description provided."}
              </p>
            </div>
            <div className="border-t border-[#272727] pt-6 space-y-3">
              <h3 className="text-white text-lg font-semibold mb-2">Stats</h3>
              <p className="text-sm">
                Joined {new Date(userProfile?.createdAt || user?.createdAt).toDateString()}
              </p>
              <p className="text-sm">Email: {userProfile?.email || user?.email}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default UserPage;
