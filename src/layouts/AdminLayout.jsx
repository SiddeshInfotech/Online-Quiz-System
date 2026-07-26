import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  ShieldAlert,
  Inbox,
  MessageSquare,
  LogOut,
  Shield,
  Menu,
  X,
  Bell,
  CheckCheck,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import adminService from "../services/adminService";

const AdminLayout = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications State
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Poll unread count every 30 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const data = await adminService.getUnreadNotificationCount();
        if (isMounted) {
          setUnreadCount(data?.unread_count ?? data?.count ?? 0);
        }
      } catch (err) {
        // Silent catch for background polling
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch full notification list when opening drawer
  const handleToggleDrawer = async () => {
    const nextState = !showNotifDrawer;
    setShowNotifDrawer(nextState);

    if (nextState) {
      try {
        setLoadingNotifs(true);
        const data = await adminService.getNotifications();
        const list = Array.isArray(data) ? data : data?.results ?? data?.notifications ?? [];
        setNotifications(list);
      } catch (err) {
        console.error("Failed to load admin notifications:", err);
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminService.markNotificationsRead({ all: true });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleMarkItemRead = async (id) => {
    try {
      await adminService.markNotificationsRead({ id });
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Quiz Moderation", icon: FileQuestion, path: "/admin/quizzes" },
    { label: "Penalty Logs", icon: ShieldAlert, path: "/admin/penalties" },
    { label: "Support Inbox", icon: Inbox, path: "/admin/support" },
    { label: "User Feedback", icon: MessageSquare, path: "/admin/feedback" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-inter antialiased">
      {/* Sidebar for Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-space-grotesk font-bold text-base text-slate-100 leading-none">
                QuizGen AI
              </h1>
              <span className="text-[10px] font-semibold tracking-wider text-violet-400 uppercase mt-0.5 inline-block">
                Admin Panel
              </span>
            </div>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-slate-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button Footer */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Custom Admin Environment
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Bell Icon with Unread Badge */}
            <div className="relative">
              <button
                onClick={handleToggleDrawer}
                className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Admin Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-violet-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Dropdown */}
              {showNotifDrawer && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden font-inter">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-violet-400" />
                      <h3 className="font-bold text-sm text-slate-100 font-space-grotesk">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {loadingNotifs ? (
                      <div className="p-6 text-center text-xs text-slate-400">Loading alerts...</div>
                    ) : notifications.length > 0 ? (
                      notifications.map((n) => {
                        const isUnread = n.is_read === false || n.unread === true;
                        return (
                          <div
                            key={n.id || Math.random()}
                            onClick={() => isUnread && handleMarkItemRead(n.id)}
                            className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                              isUnread ? "bg-violet-950/20 hover:bg-violet-900/20" : "hover:bg-slate-800/40"
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isUnread ? "bg-violet-500" : "bg-transparent"}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${isUnread ? "font-semibold text-slate-100" : "text-slate-300"}`}>
                                {n.title || n.message || n.detail || "System Alert"}
                              </p>
                              {n.description && (
                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.description}</p>
                              )}
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                {n.created_at ? new Date(n.created_at).toLocaleString() : "Just now"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No notifications yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin User Chip */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center font-bold text-xs">
                {(adminUser?.username || adminUser?.email || "A")[0].toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-200 leading-tight">
                  {adminUser?.username || adminUser?.full_name || "Admin Staff"}
                </p>
                <p className="text-[10px] text-slate-400">{adminUser?.email || "admin@quizgen.ai"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
