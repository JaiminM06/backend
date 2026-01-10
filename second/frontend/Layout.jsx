// // src/App.jsx
// import { useState } from "react";
// import { Menu, Search, Bell, User } from "lucide-react";
// import { Outlet } from "react-router-dom";
// import { NavLink } from "react-router-dom";
// import { useNavigate } from "react-router-dom";



// export default function Layout() {
//   const [openSidebar, setOpenSidebar] = useState(false);
//   const navigate= useNavigate()

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Sidebar */}
//       <div
//         className={`fixed top-0 left-0 h-full bg-white shadow-md w-56 transform ${
//           openSidebar ? "translate-x-0" : "-translate-x-full"
//         } transition-transform md:translate-x-0 md:static`}
//       >
//         <div className="p-4 text-lg font-bold border-b">MyTube</div>
//         <nav className="p-4 space-y-3">
          
//           <NavLink className="block hover:text-red-500"
//         to='uploadVideo'>📤 Upload video</NavLink>
//         <NavLink className="block hover:text-red-500"
//         to='getVideos'> 🎥 My Videos</NavLink>
//           <a href="#" className="block hover:text-red-500">🏠 Home</a>
//           <a href="#" className="block hover:text-red-500">🔥 Trending</a>
//           <a href="#" className="block hover:text-red-500">📺 Subscriptions</a>
//           <a href="#" className="block hover:text-red-500">📚 Library</a>
//         </nav>
//       </div>

//       {/* Main content */}
//       <div className="flex-1 flex flex-col">
//         {/* Navbar */}
//         <header className="flex items-center justify-between bg-white px-4 py-2 shadow">
//           <div className="flex items-center gap-2">
//             <button onClick={() => setOpenSidebar(!openSidebar)} className="md:hidden">
//               <Menu />
//             </button>
//             <span className="font-bold text-lg hidden md:block">MyTube</span>
//           </div>

//           <div className="flex items-center w-full max-w-lg bg-gray-100 rounded-full px-3 py-1">
//             <input
//               type="text"
//               placeholder="Search"
//               className="bg-transparent flex-1 outline-none px-2"
//             />
//             <Search className="text-gray-600" />
//           </div>

//           <div className="flex items-center gap-4">
//             <Bell />
//             <User onClick={()=>{navigate('/Home/user')}}/>
//           </div>
//         </header>
//         <main className="overflow-y-auto">
//           <Outlet/></main>   
//       </div>
      
//     </div>
    
//   );
// }

// src/App.jsx
// import { useState } from "react";
// import { Menu, Search, Bell, User } from "lucide-react";
// import { Outlet } from "react-router-dom";
// import { NavLink } from "react-router-dom";
// import { useNavigate } from "react-router-dom";

// export default function Layout() {
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const navigate = useNavigate();

//   const toggleSidebar = () => {
//     setSidebarOpen(!sidebarOpen);
//   };

//   return (
//     <>
//     <div className="min-h-screen flex flex-col">

//     <header className="flex items-center justify-between bg-white px-4 py-2 shadow">

//           <div className="flex items-center gap-2 overflow-y-auto">
//             <button 
//                 onClick={toggleSidebar}
//                 className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-blue-700"
//               >
//                 <Menu size={20} className="bg-blue-700" / >
//               </button>
//             <span className="font-bold text-lg hidden md:block">MyTube</span>
//           </div>

//           <div className="flex items-center w-full max-w-lg bg-gray-100 rounded-full px-3 py-1">
//             <input
//               type="text"
//               placeholder="Search"
//               className="bg-transparent flex-1 outline-none px-2"
//             />
//             <Search className="text-gray-600" />
//           </div>

//           <div className="flex items-center gap-4">
//             <Bell />
//             <User onClick={()=>{navigate('/Home/user')}}/>
//           </div>
//         </header>
//         <div className="flex flex-1 bg-gray-100">
//       {/* Sidebar */}
//       <div
//         className={`
//           bg-white shadow-lg
//           transition-all duration-300 ease-in-out
//           flex flex-col
//           ${sidebarOpen ? 'w-64' : 'w-0'}
//           ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}
//           overflow-y-auto
//         `}
//       >
//         {/* Navigation */}
//         <nav className="p-4 space-y-2 flex-1 min-w-[256px] md:min-w-0 overflow-y-auto">
//           <NavLink
//             to="/Home"
//             className={({ isActive }) =>
//               `flex items-center gap-3 p-3 rounded-lg transition-colors ${
//                 isActive
//                   ? 'bg-red-50 text-red-600 font-medium'
//                   : 'text-gray-700 hover:bg-gray-100 hover:text-red-500'
//               }`
//             }
//           >
//             <span>🏠</span>
//             <span className={`${!sidebarOpen && 'md:hidden'}`}>Home</span>
//           </NavLink>
          
//           <NavLink
//             to="uploadVideo"
//             className={({ isActive }) =>
//               `flex items-center gap-3 p-3 rounded-lg transition-colors ${
//                 isActive
//                   ? 'bg-red-50 text-red-600 font-medium'
//                   : 'text-gray-700 hover:bg-gray-100 hover:text-red-500'
//               }`
//             }
//           >
//             <span>📤</span>
//             <span className={`${!sidebarOpen && 'md:hidden'}`}>Upload Video</span>
//           </NavLink>
          
  
          
//           <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-500 transition-colors">
//             <span>🔥</span>
//             <span className={`${!sidebarOpen && 'md:hidden'}`}>Trending</span>
//           </a>
//           <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-500 transition-colors">
//             <span>📺</span>
//             <span className={`${!sidebarOpen && 'md:hidden'}`}>Subscriptions</span>
//           </a>
//           <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-500 transition-colors">
//             <span>📚</span>
//             <span className={`${!sidebarOpen && 'md:hidden'}`}>Library</span>
//           </a>
          
//         </nav>
//       </div>

//       {/* Main content */}
//       <div className="flex-1 flex flex-col">
//         {/* Navbar */}
        
//         <main className="overflow-y-auto">
//           <Outlet/></main>   
//       </div>
//     </div>
//     </div>
//     </>
    
//   );
// }


import { useState,useEffect } from "react";
import { Menu, Search, Bell, User } from "lucide-react";
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";  

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
    const [videos, setVideos] = useState([]);

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
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`
          bg-white shadow-lg
          transition-all duration-300 ease-in-out
          flex flex-col
          ${sidebarOpen ? 'w-64' : 'w-0'}
          ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}
          
          
        `}
      >
        <button 
                onClick={toggleSidebar}
                className="p-4 hover:bg-gray-100  transition-colors bg-blue-700 shadow"
              >
                <Menu size={20} className="bg-blue-700 " / >
              </button>
        {/* Sidebar Header */}

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 min-w-[256px] md:min-w-0 overflow-y-auto">
          <NavLink
            to="/Home/feed"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-50 text-red-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-red-500'
              }`
            }
          >
            <span>🏠</span>
            <span className={`${!sidebarOpen && 'md:hidden'}`}>Home</span>
          </NavLink>
          
          
          <NavLink
            to="uploadVideo"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-50 text-red-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-red-500'
              }`
            }
          >
            <span>📤</span>
            <span className={`${!sidebarOpen && 'md:hidden'}`}>Upload Video</span>
          </NavLink>
          
          <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-500 transition-colors">
            <span>🔥</span>
            <span className={`${!sidebarOpen && 'md:hidden'}`}>Trending</span>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-500 transition-colors">
            <span>📺</span>
            <span className={`${!sidebarOpen && 'md:hidden'}`}>Subscriptions</span>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-500 transition-colors">
            <span>📚</span>
            <span className={`${!sidebarOpen && 'md:hidden'}`}>Library</span>
          </a>
          
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="flex items-center justify-between bg-white px-4 py-2  shadow">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg hidden md:block">MyTube</span>
          </div>

          <div className="flex items-center w-full max-w-lg bg-gray-100 rounded-full px-3 py-1">
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent flex-1 outline-none px-2"
            />
            <Search className="text-gray-600" />
          </div>

          <div className="flex items-center gap-4">
            <Bell />
            <User onClick={()=>{navigate('/Home/user')}}/>
          </div>
        </header>
        
        <main className="overflow-y-auto">
          <Outlet/></main>   
      </div>
    </div>
  );
}

