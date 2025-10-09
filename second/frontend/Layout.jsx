// src/App.jsx
import { useState } from "react";
import { Menu, Search, Bell, User } from "lucide-react";
import { Outlet } from "react-router-dom";

const videos = [
  { id: 1, title: "Learn React in 10 Minutes", channel: "CodeMaster", views: "120K views", thumbnail: "https://picsum.photos/300/200?1" },
  { id: 2, title: "Tailwind CSS Crash Course", channel: "DesignPro", views: "95K views", thumbnail: "https://picsum.photos/300/200?2" },
  { id: 3, title: "Node.js Tutorial for Beginners", channel: "BackendHub", views: "150K views", thumbnail: "https://picsum.photos/300/200?3" },
  { id: 4, title: "DSA in 1 Hour", channel: "AlgoKing", views: "200K views", thumbnail: "https://picsum.photos/300/200?4" },
  
];

export default function App() {
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-md w-56 transform ${
          openSidebar ? "translate-x-0" : "-translate-x-full"
        } transition-transform md:translate-x-0 md:static`}
      >
        <div className="p-4 text-lg font-bold border-b">MyTube</div>
        <nav className="p-4 space-y-3">
          <a href="#" className="block hover:text-red-500">🏠 Home</a>
          <a href="#" className="block hover:text-red-500">🔥 Trending</a>
          <a href="#" className="block hover:text-red-500">📺 Subscriptions</a>
          <a href="#" className="block hover:text-red-500">📚 Library</a>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="flex items-center justify-between bg-white px-4 py-2 shadow">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpenSidebar(!openSidebar)} className="md:hidden">
              <Menu />
            </button>
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
            <User />
          </div>
        </header>
      </div>
      <Outlet/>
    </div>
    
  );
}

