import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Bell, LogOut, Settings, User as UserIcon, Sparkles, Menu, Trophy, Calendar, Star, FileText, Target, Loader2 } from "lucide-react";
import Button from "../ui/Button/Button";
import { useDashboardContext } from "../../context/DashboardContext";
import notificationService from "../../services/notificationService";
import libraryService from "../../services/libraryService";
import useDebounce from "../../hooks/useDebounce";
import { getLanguageIcon } from "../../utils/languageIcons";
import { useAuth } from "../../hooks/useAuth";

const getNotificationIcon = (type) => {
  switch (String(type).toLowerCase()) {
    case "trophy":
      return { icon: Trophy, bg: "bg-amber-100", color: "text-amber-500" };
    case "calendar":
      return { icon: Calendar, bg: "bg-violet-100", color: "text-violet-600" };
    case "star":
      return { icon: Star, bg: "bg-orange-100", color: "text-orange-500" };
    case "document":
      return { icon: FileText, bg: "bg-cyan-100", color: "text-cyan-500" };
    case "target":
      return { icon: Target, bg: "bg-purple-100", color: "text-purple-600" };
    default:
      return { icon: Star, bg: "surface-elev", color: "text-app-muted" };
  }
};

const TopNav = ({ user, notifications = [], onMenuToggle }) => {
  const { logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setData } = useDashboardContext();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    notificationService.getUnreadCount()
      .then(res => setServerUnreadCount(res.unread_count || 0))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      setIsSearching(true);
      setSearchError(false);
      libraryService.searchQuizzes(debouncedSearchQuery)
        .then(res => {
          if (res.status === "success" && Array.isArray(res.data)) {
            setSearchResults(res.data);
          } else {
            setSearchResults([]);
          }
        })
        .catch(err => {
          console.error("Search error:", err);
          setSearchError(true);
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    } else {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(false);
    }
  }, [debouncedSearchQuery]);

  const handleNotificationClick = async (notif) => {
    if (notif.isRead) return;

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notif.id ? { ...n, isRead: true } : n
        ),
      };
    });

    try {
      const res = await notificationService.markAsRead(notif.id);
      if (res && res.unread_count !== undefined) {
        setServerUnreadCount(res.unread_count);
      } else {
        setServerUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      // Revert optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notif.id ? { ...n, isRead: false } : n
          ),
        };
      });
    }
  };

  const handleMarkAllRead = async () => {
    const hasUnread = notifications.some((n) => !n.isRead);
    if (!hasUnread) return;

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
      };
    });

    try {
      const res = await notificationService.markAllAsRead();
      if (res && res.unread_count !== undefined) {
        setServerUnreadCount(res.unread_count);
      } else {
        setServerUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const showGlobalSearch = location.pathname === "/dashboard" || location.pathname === "/library";

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = user?.role === "admin";
  const unreadCount = serverUnreadCount;

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between px-4 md:px-8 backdrop-blur-md border-b border-app" style={{ backgroundColor: "color-mix(in srgb, var(--bg-surface) 80%, transparent)" }}>
      
      <div className="flex items-center flex-1 gap-2 md:gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-app-muted hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar */}
        {showGlobalSearch && (
          <>
            <div className="w-full max-w-md hidden sm:block relative" ref={searchContainerRef}>
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-slate-400" size={18} />
                <input
                  type="text"
                  name="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!showSearchDropdown) setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Search for quizzes, subjects, topics..."
                  className="h-11 w-full rounded-xl border border-app surface-subtle pl-11 pr-4 text-sm text-app outline-none transition-all focus:border-[var(--accent)] focus:bg-[var(--bg-surface)] focus:ring-4 focus:ring-[var(--accent-soft)] placeholder:text-app-muted"
                />
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && searchQuery.length >= 2 && (
                <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto rounded-2xl surface shadow-xl border border-app z-50 p-2 animate-in fade-in slide-in-from-top-4 duration-200">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-4 text-app-muted gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-sm">Searching...</span>
                    </div>
                  ) : searchError ? (
                    <div className="p-4 text-center text-sm text-red-500">
                      Unable to search quizzes
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-app-muted">
                      No quizzes found
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {searchResults.map((result) => {
                        const { icon: LanguageIcon } = getLanguageIcon(result.subject);
                        return (
                          <div
                            key={result.quiz_id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors"
                            onClick={() => {
                              setShowSearchDropdown(false);
                              navigate(`/quiz/${result.quiz_id}`);
                            }}
                          >
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 surface-subtle">
                              <LanguageIcon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-app truncate mb-0.5">
                                {result.title}
                              </h4>
                              <p className="text-xs text-app-muted truncate">
                                {result.subject} {result.topic && `• ${result.topic}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Mobile Search Icon */}
            <button className="sm:hidden p-2 rounded-xl text-app-muted hover:bg-[var(--bg-elevated)] transition-colors">
              <Search size={22} />
            </button>
          </>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-6">
        <Link to={isAdmin ? "/quiz-management" : "/generate"} className="hidden md:block">
          <Button variant="primary" size="md" className="gap-2 transition-transform active:scale-95">
            {isAdmin ? <Plus size={18} /> : <Sparkles size={18} />}
            {isAdmin ? "Create Quiz" : "Generate Quiz"}
          </Button>
        </Link>
        <Link to={isAdmin ? "/quiz-management" : "/generate"} className="md:hidden">
          <Button variant="primary" size="sm" className="p-2 transition-transform active:scale-95 rounded-xl">
            {isAdmin ? <Plus size={18} /> : <Sparkles size={18} />}
          </Button>
        </Link>

        <div className="relative" ref={notifRef}>
          <div 
            className="relative cursor-pointer text-app-muted hover:text-violet-600 transition-colors p-2 rounded-full hover:bg-violet-50"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-[var(--bg-surface)]">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl surface p-4 shadow-xl border border-app z-50 origin-top-right animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-app-2">Notifications</h3>
                <span 
                  className="text-xs text-violet-600 cursor-pointer hover:underline"
                  onClick={handleMarkAllRead}
                >
                  Mark all as read
                </span>
              </div>
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto no-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const { icon: Icon, bg, color } = getNotificationIcon(notif.iconType);
                    return (
                      <div 
                        key={notif.id} 
                        className={`flex gap-3 p-2 hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer ${!notif.isRead ? 'bg-violet-50/50' : ''}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-app whitespace-pre-line">{notif.text}</p>
                          <p className="text-[10px] text-app-muted mt-1">{notif.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-app-muted text-center py-4">No new notifications</p>
                )}
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
            className="h-10 w-10 rounded-full object-cover ring-2 ring-transparent hover:ring-violet-200 ring-offset-2 ring-offset-[var(--bg-surface)] shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
          />

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl surface p-2 shadow-xl border border-app z-50 origin-top-right animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="px-3 py-2 border-b border-app mb-2">
                <p className="text-sm font-semibold text-app">{user?.name || "Student User"}</p>
                <p className="text-xs text-app-muted">{user?.email || "student@example.com"}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-app-2 hover:bg-[var(--bg-elevated)] hover:text-violet-500 rounded-xl transition-colors">
                  <UserIcon size={16} /> My Profile
                </Link>
                <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-app-2 hover:bg-[var(--bg-elevated)] hover:text-violet-500 rounded-xl transition-colors">
                  <Settings size={16} /> Settings
                </Link>
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
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
