import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Home, Search, Bell, Bookmark, User,
  Feather, Menu, X, Film,
} from "lucide-react";
import useSocket from "../hooks/useSocket.js";
import NotificationBell from "../components/Notifications/NotificationBell.jsx";
import TweetComposer from "../components/Tweets/TweetComposer.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/twitter/home", icon: Home, label: "Home" },
  { to: "/twitter/search", icon: Search, label: "Explore" },
  { to: "/twitter/notifications", icon: Bell, label: "Notifications", comingSoon: true },
  { to: "#", icon: Bookmark, label: "Bookmarks", comingSoon: true },
];

export default function TwitterLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth();
  const socketToken = user?._id || null;
  const socket = useSocket(socketToken);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--tw-surface)] text-[var(--tw-text)] font-sans">
      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Composer Modal overlay */}
      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowComposer(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[600px] bg-[#16181C] rounded-t-2xl sm:rounded-2xl border border-[#2F3336] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowComposer(false)}
                  className="text-white hover:bg-white/10 p-2 rounded-full"
                >
                  ✕
                </button>
                <span className="text-white font-bold">New Post</span>
                <div className="w-9" />
              </div>
              <TweetComposer
                onTweetPosted={() => setShowComposer(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col items-center xl:items-stretch w-[68px] xl:w-[275px] py-3 px-2 xl:px-4 border-r border-[var(--tw-border)] flex-shrink-0 h-full">
        {/* Logo */}
        <button
          onClick={() => navigate("/twitter/home")}
          className="flex items-center justify-center xl:justify-start gap-3 w-12 h-12 xl:w-auto xl:px-3 rounded-full hover:bg-white/5 transition-colors mb-2"
        >
          <span className="text-2xl">🐦</span>
          <span className="hidden xl:block text-xl font-bold tracking-tight">MediaVerse X</span>
        </button>

        {/* Nav items */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.comingSoon ? "#" : item.to}
              onClick={(e) => {
                if (item.comingSoon) e.preventDefault();
                setMobileMenuOpen(false);
              }}
              className={({ isActive }) =>
                `flex items-center justify-center xl:justify-start gap-4 px-3 py-3 rounded-full transition-all duration-150 group
                ${item.comingSoon ? "opacity-40 cursor-not-allowed" : ""}
                ${isActive && !item.comingSoon
                  ? "text-white font-bold"
                  : "text-[var(--tw-text-secondary)] hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={24} strokeWidth={isActive && !item.comingSoon ? 2.5 : 1.75} />
                  <span className="hidden xl:block text-lg">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Profile */}
          {user && (
            <NavLink
              to={`/twitter/profile/${user.username}`}
              className={({ isActive }) =>
                `flex items-center justify-center xl:justify-start gap-4 px-3 py-3 rounded-full transition-all duration-150
                ${isActive ? "text-white font-bold" : "text-[var(--tw-text-secondary)] hover:bg-white/5 hover:text-white"}`
              }
            >
              {({ isActive }) => (
                <>
                  <User size={24} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className="hidden xl:block text-lg">Profile</span>
                </>
              )}
            </NavLink>
          )}

          {/* Post button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowComposer(true)}
            className="w-12 h-12 xl:w-full xl:h-auto xl:py-3 mt-3 bg-[var(--tw-primary)] text-white rounded-full font-bold text-lg hover:brightness-110 transition-all flex items-center justify-center"
          >
            <Feather size={22} className="xl:hidden" />
            <span className="hidden xl:block">Post</span>
          </motion.button>
        </nav>

        {/* Switch to YouTube */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            localStorage.setItem("mv_last_platform", "youtube");
            navigate("/youtube/feed");
          }}
          className="flex items-center justify-center xl:justify-start gap-3 w-12 h-12 xl:w-full xl:h-auto xl:px-4 xl:py-2.5 mb-2 bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/20 rounded-full hover:bg-[#FF0000]/20 hover:border-[#FF0000]/40 transition-all text-sm font-semibold"
        >
          <Film size={18} />
          <span className="hidden xl:block">YouTube</span>
        </motion.button>

        {/* User card */}
        {user && (
          <button
            onClick={() => navigate(`/twitter/profile/${user.username}`)}
            className="flex items-center justify-center xl:justify-start gap-3 p-2 xl:p-3 rounded-full hover:bg-white/5 transition-colors w-full"
          >
            <img
              src={user.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-[var(--tw-border)]"
            />
            <div className="hidden xl:block flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
              <p className="text-xs text-[var(--tw-text-secondary)] truncate">@{user.username}</p>
            </div>
          </button>
        )}
      </aside>

      {/* Center Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 h-14 px-4 bg-[var(--tw-surface)]/80 backdrop-blur-xl border-b border-[var(--tw-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-white/5"
            >
              <Menu size={20} />
            </button>
            <span className="text-lg font-bold">🐦</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => {
              localStorage.setItem("mv_last_platform", "youtube");
              navigate("/youtube/feed");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/20 rounded-full text-xs font-semibold"
          >
            <Film size={14} />
            <span>YouTube</span>
          </motion.button>
        </header>

        {/* Feed */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[600px] w-full mx-auto min-h-full border-x border-[var(--tw-border)]">
            <Outlet context={{ socket, currentUserId: user?._id, user, platform: "twitter", showComposer, setShowComposer }} />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around h-14 bg-[var(--tw-surface)] border-t border-[var(--tw-border)] flex-shrink-0">
          <NavLink
            to="/twitter/home"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? "text-white" : "text-[var(--tw-text-secondary)]"}`
            }
          >
            <Home size={22} />
          </NavLink>
          <NavLink
            to="/twitter/search"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? "text-white" : "text-[var(--tw-text-secondary)]"}`
            }
          >
            <Search size={22} />
          </NavLink>
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center justify-center w-12 h-12 -mt-4 bg-[var(--tw-primary)] rounded-full text-white shadow-lg shadow-[var(--tw-primary)]/30"
          >
            <Feather size={20} />
          </button>
          <NavLink
            to={user ? `/twitter/profile/${user.username}` : "#"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? "text-white" : "text-[var(--tw-text-secondary)]"}`
            }
          >
            <User size={22} />
          </NavLink>
        </nav>
      </div>

      {/* Desktop Right Sidebar */}
      <aside className="hidden lg:flex flex-col w-[350px] flex-shrink-0 h-full overflow-y-auto border-l border-[var(--tw-border)] p-6 gap-5">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = e.currentTarget.elements.namedItem("q").value.trim();
            if (q) navigate(`/twitter/search?q=${encodeURIComponent(q)}`);
          }}
          className="relative"
        >
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--tw-text-secondary)] pointer-events-none" />
          <input
            name="q"
            type="text"
            placeholder="Search posts"
            className="w-full bg-[var(--tw-card)] text-sm text-white placeholder:text-[var(--tw-text-secondary)] rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--tw-primary)]/40 border border-[var(--tw-border)] transition"
          />
        </form>

        {/* User card */}
        {user ? (
          <div className="bg-[var(--tw-card)] rounded-2xl p-4 border border-[var(--tw-border)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--tw-text-secondary)] mb-3">Your account</p>
            <button onClick={() => navigate(`/twitter/profile/${user.username}`)} className="flex items-center gap-3 w-full text-left group">
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-[var(--tw-border)]" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate group-hover:underline">{user.fullName}</p>
                <p className="text-sm text-[var(--tw-text-secondary)] truncate">@{user.username}</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-[var(--tw-card)] rounded-2xl p-4 border border-[var(--tw-border)]">
            <p className="text-sm text-[var(--tw-text-secondary)] mb-3">Sign in to post and follow.</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Platform switch card */}
        <div className="bg-[var(--tw-card)] rounded-2xl p-4 border border-[var(--tw-border)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--tw-text-secondary)] mb-2">Switch view</p>
          <p className="text-sm text-white mb-3">Jump back to the video feed.</p>
          <button
            onClick={() => {
              localStorage.setItem("mv_last_platform", "youtube");
              navigate("/youtube/feed");
            }}
            className="w-full py-2.5 rounded-full bg-[#FF0000] text-white text-sm font-bold hover:bg-[#CC0000] transition-colors flex items-center justify-center gap-2"
          >
            <Film size={16} />
            Switch to YouTube
          </button>
        </div>
      </aside>
    </div>
  );
}
