import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from './config/api.js'
import { AuthProvider } from './context/AuthContext.jsx'

// Auth pages
import Login from './components/Login/Login.jsx'
import Register from './components/Register/Register.jsx'
import LandingPage from './components/Landing/LandingPage.jsx'

// Layouts
import YouTubeLayout from './layouts/YouTubeLayout.jsx'
import TwitterLayout from './layouts/TwitterLayout.jsx'

// YouTube components
import Feed from './components/Videos/feed.jsx'
import Trending from './components/Videos/Trending.jsx'
import VideoPlayer from './components/Videos/videoPlayer.jsx'
import Upload from './components/Videos/upload.jsx'
import ManageVideos from './components/Videos/ManageVideos.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import VideoAnalytics from './components/Dashboard/VideoAnalytics.jsx'
import Library from './components/UserPage/Library.jsx'
import ManageAccount from './components/UserPage/ManageAccount.jsx'
import UserPage from './components/UserPage/Userpage.jsx'
import SearchResults from './components/Search/SearchResults.jsx'

// Twitter components
import TwitterFeed from './components/Tweets/TwitterFeed.jsx'
import TweetThread from './components/Tweets/TweetThread.jsx'

// Auth guard
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

// Set global axios defaults
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip interceptor entirely for requests that opt out (e.g. landing page session check)
    if (originalRequest?._skipInterceptor) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes("/users/login") && 
      !originalRequest.url?.includes("/users/refresh-token") &&
      !originalRequest.url?.includes("/users/current-user")
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${API_BASE_URL}/api/v1/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        return axios(originalRequest);
      } catch (refreshError) {
        // Only redirect to /login if we're NOT on the landing page, login, or register
        const path = window.location.pathname;
        if (path !== '/' && path !== '/login' && path !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Landing Page */}
      <Route path='/' element={<LandingPage />} />

      {/* Auth (no layout) */}
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />

      {/* Legacy redirects */}
      <Route path='/Login' element={<Navigate to="/login" replace />} />
      <Route path='/Register' element={<Navigate to="/register" replace />} />
      <Route path='/Home/feed' element={<Navigate to="/youtube/feed" replace />} />
      <Route path='/Home/tweets' element={<Navigate to="/twitter/home" replace />} />
      <Route path='/Home/tweets/:tweetId' element={<Navigate to="/twitter/home" replace />} />
      <Route path='/Home/tweet/:tweetId' element={<Navigate to="/twitter/home" replace />} />
      <Route path='/Home/:id' element={<Navigate to="/youtube/feed" replace />} />

      {/* YouTube Platform */}
      <Route path='/youtube' element={<YouTubeLayout />}>
        <Route index element={<Navigate to="/youtube/feed" replace />} />
        <Route path='feed' element={<Feed />} />
        <Route path='trending' element={<Trending />} />
        <Route path='watch/:id' element={<VideoPlayer />} />
        <Route path='search' element={<SearchResults />} />
        <Route path='channel/:username' element={<UserPage />} />
        <Route path='library' element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path='upload' element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path='manage' element={<ProtectedRoute><ManageVideos /></ProtectedRoute>} />
        <Route path='dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path='dashboard/video/:videoId' element={<ProtectedRoute><VideoAnalytics /></ProtectedRoute>} />
        <Route path='settings' element={<ProtectedRoute><ManageAccount /></ProtectedRoute>} />
        <Route path='user' element={<ProtectedRoute><UserPage /></ProtectedRoute>} />
      </Route>

      {/* Twitter Platform */}
      <Route path='/twitter' element={<TwitterLayout />}>
        <Route index element={<Navigate to="/twitter/home" replace />} />
        <Route path='home' element={<TwitterFeed />} />
        <Route path='tweet/:tweetId' element={<TweetThread />} />
        <Route path='profile/:username' element={<UserPage />} />
        <Route path='search' element={<SearchResults />} />
      </Route>
    </>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
