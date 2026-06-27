import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Home from './components/Home/Home.jsx'
import Login from './components/Login/Login.jsx'
import Register from './components/Register/Register.jsx'
import Layout from '../Layout.jsx'
import Upload from './components/Videos/upload.jsx'
import VideoPlayer from './components/Videos/videoPlayer.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import VideoAnalytics from './components/Dashboard/VideoAnalytics.jsx'
import UserPage from './components/UserPage/Userpage.jsx'
import ManageVideos from './components/Videos/ManageVideos.jsx'
import ManageAccount from './components/UserPage/ManageAccount.jsx'
import Feed from './components/Videos/feed.jsx'
import Trending from './components/Videos/Trending.jsx'
import Library from './components/UserPage/Library.jsx'
import TweetThread from './components/Tweets/TweetThread.jsx'
import TwitterFeed from './components/Tweets/TwitterFeed.jsx'



// Set global axios default for cross-origin credentials (JWT cookies)
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/refresh-token`,
          {},
          { withCredentials: true }
        );

        // Retry the original request with the new cookie
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh also failed — redirect to login
        window.location.href = '/Login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Route Guard Component
const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/current-user`,
      { withCredentials: true }
    )
      .then(() => {
        setAuthed(true);
        setChecking(false);
      })
      .catch((err) => {
        setChecking(false);
        if (err.response?.status === 401) {
          navigate('/Login');
        } else {
          setError('Connection error. Please check your internet and try again.');
        }
      });
  }, [navigate]);

  if (checking) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <p className="text-red-400">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-slate-700 text-white rounded-lg"
      >
        Retry
      </button>
    </div>
  );

  return authed ? children : null;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/' element={<Home />} />
      <Route path='/Login' element={<Login />} />
      <Route path='/Register' element={<Register />} />
      <Route path='/Home' element={<Layout />}>
        <Route path='feed' element={<Feed />} />
        <Route path='trending' element={<Trending />} />
        <Route path='library' element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path='user' element={<ProtectedRoute><UserPage /></ProtectedRoute>} />
        <Route path='ManageAccount' element={<ProtectedRoute><ManageAccount /></ProtectedRoute>} />
        <Route path='dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path='dashboard/video/:videoId' element={<ProtectedRoute><VideoAnalytics /></ProtectedRoute>} />
        <Route path='uploadVideo' element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path='ManageVideos' element={<ProtectedRoute><ManageVideos /></ProtectedRoute>} />
        <Route path='tweets/:tweetId' element={<TweetThread />} />
        <Route path='tweet/:tweetId' element={<TweetThread />} />
        <Route path='tweets' element={<TwitterFeed />} />
        <Route path=':id' element={<VideoPlayer />} />
      </Route>
    </>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
