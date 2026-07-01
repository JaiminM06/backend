import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Menu, Search, Home, Flame, Library, Upload, BarChart2,
  Settings, Video, X, Twitter,
} from "lucide-react";
import useSocket from "../hooks/useSocket.js";
import NotificationBell from "../components/Notifications/NotificationBell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/youtube/feed", icon: Home, label: "Home" },
  { to: "/youtube/trending", icon: Flame, label: "Trending" },
  { to: "/youtube/library", icon: Library, label: "Library" },
  { to: "/youtube/manage", icon: Video, label: "Your Videos" },
  { to: "/youtube/dashboard", icon: BarChart2, label: "Dashboard" },
  { to: "/youtube/upload", icon: Upload, label: "Upload" },
  { to: "/youtube/settings", icon: Settings, label: "Settings" },
];

export default function YouTubeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { user } = useAuth();
  const socketToken = user?._id || null;
  const socket = useSocket(socketToken);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/youtube/search?q=${encodeURIComponent(q)}`);
    setSearchQuery("");
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen((prev) => !prev);
    } else {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--yt-surface)] text-white overflow-hidden font-sans">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isExpanded ? 240 : 72 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`
          fixed md:static z-50
          flex flex-col h-full bg-[var(--yt-secondary)] flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          transition-transform duration-200 md:transition-none
        `}
      >
        {/* Logo */}
        <div className={`flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-2"} h-16 border-b border-[var(--yt-border)]`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 text-[var(--yt-text-secondary)] shrink-0 transition-colors"
            >
              <Menu size={20} />
            </button>
            {isExpanded && (
              <button
                onClick={() => navigate("/youtube/feed")}
                className="font-bold text-lg tracking-tight text-white truncate hover:text-[var(--yt-primary)] transition-colors"
              >
                🎬 MediaVerse
              </button>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg text-[var(--yt-text-secondary)] shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              end={item.to === "/youtube/feed"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 font-medium text-sm group
                ${isActive
                  ? "bg-[var(--yt-primary)]/15 text-[var(--yt-primary)]"
                  : "text-[var(--yt-text-secondary)] hover:bg-white/5 hover:text-white"
                } ${!isExpanded ? "justify-center" : ""}`
              }
              title={!isExpanded ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg ${isActive ? "bg-[var(--yt-primary)] text-white" : "text-inherit"}`}>
                    <item.icon size={18} />
                  </div>
                  {isExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        {user && isExpanded && (
          <div className="p-3 border-t border-[var(--yt-border)]">
            <button
              onClick={() => navigate("/youtube/channel/me")}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all w-full text-left group"
            >
              <img
                src={user.avatar}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-[var(--yt-border)] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                <p className="text-xs text-[var(--yt-text-muted)] truncate">@{user.username}</p>
              </div>
            </button>
          </div>
        )}
      </motion.aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Navbar */}
        <header className="h-14 bg-[var(--yt-surface)] border-b border-[var(--yt-border)] px-3 md:px-5 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-white/10 text-[var(--yt-text-secondary)] shrink-0"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="flex w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full bg-[#121212] text-white px-4 py-2 rounded-l-full focus:outline-none focus:ring-1 focus:ring-[var(--yt-primary)]/50 border border-[#303030] placeholder-[var(--yt-text-muted)] text-sm"
              />
              <button
                type="submit"
                className="bg-[#222] hover:bg-[#333] border border-[#303030] border-l-0 px-5 py-2 rounded-r-full transition-colors flex items-center justify-center shrink-0"
              >
                <Search size={16} className="text-[var(--yt-text-secondary)]" />
              </button>
            </form>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Switch to Twitter */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                localStorage.setItem("mv_last_platform", "twitter");
                navigate("/twitter/home");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--tw-primary)]/10 text-[var(--tw-primary)] border border-[var(--tw-primary)]/20 rounded-full hover:bg-[var(--tw-primary)]/20 hover:border-[var(--tw-primary)]/40 transition-all text-xs font-semibold"
            >
              <Twitter size={14} />
              <span className="hidden sm:inline">Twitter</span>
            </motion.button>

            {user && <NotificationBell socket={socket} platform="youtube" />}

            {user ? (
              <button
                onClick={() => navigate("/youtube/channel/me")}
                className="w-8 h-8 rounded-full overflow-hidden border border-[var(--yt-border)] hover:border-[var(--yt-primary)]/50 transition-colors"
              >
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-[var(--yt-primary)] text-white px-4 py-1.5 rounded-full font-semibold text-xs hover:bg-[var(--yt-primary-hover)] transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Page content with transition */}
        <main className="flex-1 overflow-y-auto bg-[var(--yt-surface)]">
          <Outlet context={{ socket, currentUserId: user?._id, user, platform: "youtube" }} />
        </main>
      </div>
    </div>
  );
}
