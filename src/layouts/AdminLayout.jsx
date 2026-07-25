import { useState } from "react";
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
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminLayout = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
              <Bell size={18} />
            </button>

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
