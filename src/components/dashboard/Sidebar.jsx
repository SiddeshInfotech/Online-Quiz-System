import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  Award,
  Sparkles,
  Target,
  User,
  Settings,
  ChevronDown,
  X,
  MessageSquare,
  Trophy,
} from "lucide-react";
import Button from "../ui/Button/Button";
import Logo from "../ui/Logo";

const Sidebar = ({ user, dailyGoal, onMenuClose }) => {
  const mainLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Quiz Library", path: "/library", icon: BookOpen },
    { name: "Generate Quiz", path: "/generate", icon: Sparkles },
    { name: "My Attempts", path: "/attempts", icon: FileCheck2 },
    { name: "Leaderboard", path: "/leaderboard", icon: Award },
    { name: "Achievements", path: "/achievements", icon: Trophy },
    { name: "Feedback", path: "/feedback", icon: MessageSquare },
  ];

  const bottomLinks = [
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="h-full w-full flex flex-col surface border-r border-app shadow-xl lg:shadow-none">
      {/* Logo Area */}
      <div className="flex h-20 items-center justify-between px-6 border-b border-transparent">
        <Logo />
        
        {/* Mobile Close Button */}
        <button 
          onClick={onMenuClose}
          className="lg:hidden p-2 rounded-lg text-app-muted hover:text-app-2 hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-4 no-scrollbar flex flex-col gap-2">
        
        {/* Main Links */}
        <div className="flex flex-col gap-2">
          {mainLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : "text-app-2 hover:bg-[var(--bg-elevated)] hover:text-violet-500"
                }`
              }
            >
              <link.icon size={20} />
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Bottom Links */}
        <div className="flex flex-col gap-2">
          {bottomLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-violet-600"
                }`
              }
            >
              <link.icon size={20} />
              {link.name}
            </NavLink>
          ))}
        </div>
        
        {/* Today's Goal */}
        <div className="mt-auto">
          <div className="rounded-2xl surface-subtle p-5 border border-app hover:border-[var(--accent-hover)] transition-colors shadow-sm">
            <div className="flex items-center gap-2 text-violet-600 mb-2">
              <Target size={20} className="text-violet-600" />
              <span className="font-semibold text-sm">Today's Goal</span>
            </div>
            <p className="text-xs text-app-muted mb-3 leading-relaxed">
              Complete {dailyGoal?.total || 3} quizzes today.
            </p>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-app-2">Progress</span>
                <span className="text-violet-600">{dailyGoal?.completed || 0}/{dailyGoal?.total || 3}</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-600 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min(((dailyGoal?.completed || 0) / (dailyGoal?.total || 3)) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <Link to="/library">
              <Button variant="secondary" size="sm" className="w-full justify-between group">
                Start Quiz
                <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="mt-auto border-t border-app p-4">
        <Link to="/profile" className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer group">
          <img
            src={user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || "User")}&background=6D5EF9&color=fff`}
            alt={user?.full_name || user?.username || "User"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || "User")}&background=6D5EF9&color=fff`;
            }}
            className="h-10 w-10 rounded-full object-cover shadow-sm group-hover:ring-2 ring-violet-100 transition-all"
          />
          <div className="flex-1 overflow-hidden">
            <h4 className="truncate text-sm font-semibold text-app group-hover:text-violet-700 transition-colors">
              {user?.full_name || user?.username || "Student User"}
            </h4>
            <p className="truncate text-[10px] text-app-muted">View Profile</p>
          </div>
          <ChevronDown size={16} className="text-app-muted group-hover:text-violet-500 transition-colors" />
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
