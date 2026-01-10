import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { use } from "react";

function UserPage() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile,setUserProfile] =useState(null)
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch current user details
        const userRes = await axios.get("http://localhost:8000/api/v1/users/current-user", {
          withCredentials: true,
        });
        setUser(userRes.data.data);
        const profile=await axios.get(`http://localhost:8000/api/v1/users/c/${userRes.data.data.username}`,{
          withCredentials:true,
        })
        setUserProfile(profile.data.data)
        // Fetch user's videos
        const videosRes = await axios.get(
          `http://localhost:8000/api/v1/videos/`,
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
  const handleLogout= async () =>{
    try {
      const res = await axios.post("http://localhost:8000/api/v1/users/logout",{}, {
          withCredentials: true,
        });
        console.log(res)
        navigate("/")
    } catch (error) {
      console.log("Logout Unsuccessful")
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-xl font-semibold text-gray-600">
        Loading your dashboard...
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500 text-lg">
        Failed to load user details. Please login again.
      </div>
    );
  return (
    <div className="min-h-screen-[95vh] bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
  <h1 className="text-3xl font-bold text-indigo-700">🎬 Your Account</h1>

  <div className="flex gap-3">
     <button
      onClick={() => navigate("/Home/ManageAccount")}
      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-300"
    >
      Manage Account
    </button>
    
    <button
      onClick={() => navigate("/Home/ManageVideos")}
      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-300"
    >
      Manage Videos
    </button>

    <button
      onClick={handleLogout}
      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
    >
      Logout
    </button>
  </div>
</div>


      {/* User Info */}
<div
  className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 bg-cover bg-center"
>  {/* Avatar */}
  <img
    src={user.avatar}
    alt="User Avatar"
    className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover"
  />

  {/* User Info */}
  <div className="flex-1">
    <h2 className="text-2xl font-bold text-gray-800 mb-2">{userProfile.username}</h2>
    <div className="grid sm:grid-cols-2 gap-3 text-gray-700">
      <p>
        <span className="font-semibold text-gray-800">Email:</span> {userProfile.email}
      </p>
      <p>
        <span className="font-semibold text-gray-800">Subscribers:</span>{userProfile.subscribersCount}
        
      </p>
      <p className="sm:col-span-1">
        <span className="font-semibold text-gray-800">Joined:</span>{" "}
        {new Date(user.createdAt).toDateString()}
      </p>
      <p>
        <span className="font-semibold text-gray-800">SubscribedTo:</span>{userProfile.channelsSubscribedToCount}
      </p>
    </div>
  </div>
</div>


      {/* Videos Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 overflow-y-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">🎥 Your Uploaded Videos</h2>

        {videos.length === 0 ? (
          <p className="text-gray-500 text-center">You haven’t uploaded any videos yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
        <div
          key={video._id}
          className="bg-white rounded-lg shadow hover:shadow-lg transition"
          onClick={() => navigate(`/Home/${video._id}`)}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default UserPage;
