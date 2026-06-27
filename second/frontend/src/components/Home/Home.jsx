import React, { useState, useEffect } from "react";
import axios from "axios";
import useSocket from "../../hooks/useSocket.js";
import Feed from "../Videos/feed.jsx";
import TwitterFeed from "../Tweets/TwitterFeed.jsx";

function Home() {
  const [activeTab, setActiveTab] = useState('videos'); // 'videos' | 'tweets'
  const [user, setUser] = useState(null);
  const [socketToken, setSocketToken] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    axios.get(
      `${apiUrl}/api/v1/users/current-user`,
      { withCredentials: true }
    )
    .then(res => {
      setUser(res.data.data);
      setSocketToken(res.data.data?._id || null);
    })
    .catch(() => {
      setSocketToken(null);
    });
  }, [apiUrl]);

  const socket = useSocket(socketToken);
  const currentUserId = user?._id;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors
              ${activeTab === 'videos'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            🎬 Videos
          </button>
          <button
            onClick={() => setActiveTab('tweets')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors
              ${activeTab === 'tweets'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            🐦 Tweets
          </button>
        </div>

        {/* Feed Content */}
        <div className="mt-4">
          {activeTab === 'videos' && <Feed />}
          {activeTab === 'tweets' && (
            <TwitterFeed socket={socket} currentUserId={currentUserId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
