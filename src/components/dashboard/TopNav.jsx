import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Bell, LogOut, Settings, User as UserIcon, Sparkles, Menu } from "lucide-react";
import Button from "../ui/Button/Button";
import Input from "../ui/Input/Input";

const TopNav = ({ user, onMenuToggle }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-white/80 px-4 md:px-8 backdrop-blur-md border-b border-slate-200/50">
      
      <div className="flex items-center flex-1 gap-2 md:gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar */}
        <div className="w-full max-w-md hidden sm:block">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search for quizzes, subjects, topics..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>
        </div>
        
        {/* Mobile Search Icon */}
        <button className="sm:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Search size={22} />
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-6">
        <Link to={isAdmin ? "/quiz-management" : "/generate-quiz"} className="hidden md:block">
          <Button variant="primary" size="md" className="gap-2 transition-transform active:scale-95">
            {isAdmin ? <Plus size={18} /> : <Sparkles size={18} />}
            {isAdmin ? "Create Quiz" : "Generate Quiz"}
          </Button>
        </Link>
        <Link to={isAdmin ? "/quiz-management" : "/generate-quiz"} className="md:hidden">
          <Button variant="primary" size="sm" className="p-2 transition-transform active:scale-95 rounded-xl">
            {isAdmin ? <Plus size={18} /> : <Sparkles size={18} />}
          </Button>
        </Link>

        <div className="relative" ref={notifRef}>
          <div 
            className="relative cursor-pointer text-slate-500 hover:text-violet-600 transition-colors p-2 rounded-full hover:bg-violet-50"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={22} />
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">
              3
            </span>
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl border border-slate-100 z-50 origin-top-right animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-700">Notifications</h3>
                <span className="text-xs text-violet-600 cursor-pointer hover:underline">Mark all as read</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
                    <Bell size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800">You have a new quiz assigned!</p>
                    <p className="text-[10px] text-slate-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Plus size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800">Your score improved by 15%</p>
                    <p className="text-[10px] text-slate-400">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <img
            src={user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || "User")}&background=6D5EF9&color=fff`}
            alt={user?.full_name || user?.username || "User"}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || "User")}&background=6D5EF9&color=fff`;
            }}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-transparent hover:ring-violet-200 ring-offset-2 ring-offset-white shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
          />

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 z-50 origin-top-right animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <p className="text-sm font-semibold text-slate-800">{user?.name || "Student User"}</p>
                <p className="text-xs text-slate-500">{user?.email || "student@example.com"}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-violet-600 rounded-xl transition-colors">
                  <UserIcon size={16} /> My Profile
                </Link>
                <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-violet-600 rounded-xl transition-colors">
                  <Settings size={16} /> Settings
                </Link>
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/login');
                  }} 
                  className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full text-left"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
