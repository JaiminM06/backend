import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import Home from './components/Home/Home.jsx'
import Login from './components/Login/Login.jsx'
import Register from './components/Register/Register.jsx'
import Layout from '../Layout.jsx'
import Videos from './components/Videos/Videos.jsx'
import Upload from './components/Videos/upload.jsx'
import VideoPlayer from './components/Videos/videoPlayer.jsx'
// import Dashboard from './components/Dashboard/Dashboard.jsx'
import UserPage from './components/UserPage/Userpage.jsx'
import ManageVideos from './components/Videos/ManageVideos.jsx'
import ManageAccount from './components/UserPage/ManageAccount.jsx'
import Feed from './components/Videos/feed.jsx'   

const router= createBrowserRouter(
  createRoutesFromElements(
    <>
    <Route path='/' element={<Home/>}/>
      <Route path='/Login' element={<Login/>}/>
      <Route path='/Register' element={<Register/>}/>
      <Route path='/Home' element={<Layout/>}>
        <Route path='feed' element={<Feed/>}/>
        <Route path='getVideos'element={<UserPage/>}/>
        <Route path=':id' element={<VideoPlayer/>}/>
        <Route path='user' element={<UserPage/>}/>
        <Route path='ManageAccount' element={<ManageAccount/>}/>
      
        <Route path='uploadVideo' element={<Upload/>}/>
        <Route path='ManageVideos' element={<ManageVideos/>}/>
      </Route>
      </>
    
  )
)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
