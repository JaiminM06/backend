import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { Feather, Home, User, Tv, Search, Menu, X, LogIn } from "lucide-react";
import useSocket from "./src/hooks/useSocket.js";
import NotificationBell from "./src/components/Notifications/NotificationBell.jsx";

export default function TwitterLayout() {
  const [user, setUser] = useState(null);
  const [socketToken, setSocketToken] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    axios
      .get(`${apiUrl}/api/v1/users/current-user`, { withCredentials: true })
      .then((res) => {
        setUser(res.data.data);
        setSocketToken(res.data.data?._id || null);
      })
      .catch(() => setSocketToken(null));
  }, [apiUrl]);

  const socket = useSocket(socketToken);
  const currentUserId = user?._id;

  const switchToVideos = () => navigate("/Home/feed");
  const goHome = () => navigate("/Home/tweets");
  const goProfile = () => navigate("/Home/user");

  const SwitchButton = ({ className = "" }) => (
    <button
      onClick={switchToVideos}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors ${className}`}
      title="Switch to Videos"
    >
      <Tv size={16} />
      <span className="hidden sm:inline">Switch to Videos</span>
      <span className="sm:hidden">Videos</span>
    </button>
  );

  const RailNavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      title={label}
      aria-label={label}
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) =>
        `group flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
          isActive ? "bg-[#E8F5FE] text-[#1DA1F2]" : "text-[#0F1419] hover:bg-[#F7F9FA]"
        }`
      }
    >
      <Icon size={24} />
    </NavLink>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9FA] text-[#0F1419] font-sans">
      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-20 z-50 flex flex-col items-center gap-2 py-4 bg-white border-r border-[#EFF3F4] md:hidden">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-[#F7F9FA] mb-2"
            >
              <X size={24} />
            </button>
            <RailNavItem to="/Home/tweets" icon={Home} label="Home" />
            <RailNavItem to="/Home/user" icon={User} label="Profile" />
            <button
              onClick={switchToVideos}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"
              title="Switch to Videos"
            >
              <Tv size={22} />
            </button>
            <div className="flex-1" />
            {user && (
              <button onClick={goProfile} className="w-10 h-10 rounded-full overflow-hidden border border-[#EFF3F4]">
                <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
              </button>
            )}
          </aside>
        </>
      )}

      {/* Desktop left rail */}
      <aside className="hidden md:flex flex-col items-center gap-2 w-[88px] xl:w-[100px] py-4 px-2 bg-white border-r border-[#EFF3F4] flex-shrink-0">
        <button
          onClick={goHome}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1DA1F2] text-white mb-2 hover:bg-[#1a91da] transition-colors"
          title="Posts Home"
        >
          <Feather size={24} />
        </button>

        <RailNavItem to="/Home/tweets" icon={Home} label="Home" />
        <RailNavItem to="/Home/user" icon={User} label="Profile" />

        <button
          onClick={switchToVideos}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FECACA] transition-colors mt-1"
          title="Switch to Videos"
        >
          <Tv size={22} />
        </button>

        <div className="flex-1" />

        {user ? (
          <button
            onClick={goProfile}
            className="w-10 h-10 xl:w-11 xl:h-11 rounded-full overflow-hidden border border-[#EFF3F4] hover:opacity-80 transition-opacity"
            title={user.fullName}
          >
            <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
          </button>
        ) : (
          <button
            onClick={() => navigate("/Login")}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[#0F1419] text-white hover:bg-[#536471] transition-colors"
            title="Sign in"
            aria-label="Sign in"
          >
            <LogIn size={20} />
          </button>
        )}
      </aside>

      {/* Center column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Sticky column header */}
        <header className="sticky top-0 z-20 h-14 px-4 bg-white/90 backdrop-blur border-b border-[#EFF3F4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-full hover:bg-[#F7F9FA]"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0F1419]">Home</h1>
          </div>

          <div className="flex items-center gap-2">
            {user && <NotificationBell socket={socket} />}
            <div className="hidden sm:block">
              <SwitchButton className="px-4 py-2 text-sm bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FECACA]" />
            </div>
          </div>
        </header>

        {/* Scrollable feed column */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-xl w-full mx-auto min-h-full bg-white border-x border-[#EFF3F4]">
            <Outlet context={{ socket, currentUserId }} />
          </div>
        </main>

        {/* Mobile bottom bar */}
        <nav className="md:hidden flex items-center justify-around h-14 bg-white border-t border-[#EFF3F4] flex-shrink-0">
          <NavLink
            to="/Home/tweets"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full ${isActive ? "text-[#1DA1F2]" : "text-[#536471]"}`
            }
          >
            <Home size={22} />
            <span className="text-[10px] font-medium mt-0.5">Home</span>
          </NavLink>
          <NavLink
            to="/Home/user"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full ${isActive ? "text-[#1DA1F2]" : "text-[#536471]"}`
            }
          >
            <User size={22} />
            <span className="text-[10px] font-medium mt-0.5">Profile</span>
          </NavLink>
          <button
            onClick={switchToVideos}
            className="flex flex-col items-center justify-center flex-1 h-full text-[#DC2626]"
          >
            <Tv size={22} />
            <span className="text-[10px] font-medium mt-0.5">Videos</span>
          </button>
        </nav>
      </div>

      {/* Desktop right rail */}
      <aside className="hidden lg:flex flex-col w-[300px] xl:w-[340px] flex-shrink-0 h-full overflow-y-auto border-l border-[#EFF3F4] bg-[#F7F9FA] p-6 gap-6">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = e.currentTarget.elements.namedItem("q").value.trim();
            if (q) navigate(`/Home/search?q=${encodeURIComponent(q)}`);
          }}
          className="relative"
        >
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#536471] pointer-events-none" />
          <input
            name="q"
            type="text"
            placeholder="Search posts"
            className="w-full bg-[#EFF3F4] text-[15px] text-[#0F1419] placeholder:text-[#536471] rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/40 transition"
          />
        </form>

        {/* User card */}
        {user ? (
          <div className="bg-white rounded-2xl p-5 border border-[#EFF3F4]">
            <p className="text-[13px] font-bold uppercase tracking-wider text-[#536471] mb-3">Your account</p>
            <button onClick={goProfile} className="flex items-center gap-3 w-full text-left group">
              <img src={user.avatar} alt={user.fullName} className="w-11 h-11 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[15px] text-[#0F1419] truncate group-hover:underline">{user.fullName}</p>
                <p className="text-[15px] text-[#536471] truncate">@{user.username}</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-[#EFF3F4]">
            <p className="text-[15px] text-[#536471]">Sign in to post and follow people.</p>
            <button
              onClick={() => navigate("/Login")}
              className="mt-3 w-full py-2.5 rounded-full bg-[#0F1419] text-white text-sm font-bold hover:bg-[#536471] transition-colors"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Switch to Videos card */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFF3F4]">
          <p className="text-[13px] font-bold uppercase tracking-wider text-[#536471] mb-2">Switch view</p>
          <p className="text-[15px] text-[#0F1419] mb-4">Jump back to the video feed.</p>
          <SwitchButton className="w-full py-2.5 text-sm bg-[#DC2626] text-white hover:bg-red-700" />
        </div>
      </aside>
    </div>
  );
}
