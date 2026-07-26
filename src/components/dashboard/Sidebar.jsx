import { useState, useEffect, useContext } from "react";
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
  Crown,
} from "lucide-react";
import Button from "../ui/Button/Button";
import Logo from "../ui/Logo";
import { AuthContext } from "../../context/AuthContext";
import subscriptionService from "../../services/subscriptionService";
import { getCurrentPlan } from "../../pages/pricing/PricingPage";

const Sidebar = ({ user, dailyGoal, onMenuClose }) => {
  const { currentUser } = useContext(AuthContext);
  const [currentPlan, setCurrentPlanState] = useState(() => getCurrentPlan(currentUser || user));
  const [subData, setSubData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadSub = async () => {
      try {
        const data = await subscriptionService.getSubscription();
        if (isMounted && data) {
          setSubData(data);
          const activePlan = data.plan?.toLowerCase() || (data.is_pro ? "pro" : "free");
          setCurrentPlanState(activePlan);
        }
      } catch (err) {
        console.error("Sidebar sub fetch error:", err);
      }
    };
    loadSub();

    const handlePlanChange = (e) => {
      if (e.detail?.plan) {
        setCurrentPlanState(e.detail.plan);
      }
      loadSub();
    };
    window.addEventListener("app:refresh-plan", handlePlanChange);
    return () => {
      isMounted = false;
      window.removeEventListener("app:refresh-plan", handlePlanChange);
    };
  }, []);

  const isPro = subData ? Boolean(subData.is_pro || subData.plan === "PRO") : currentPlan === "pro";
  const daysRemaining = subData?.days_remaining ?? 30;

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
    { name: "Pricing", path: "/pricing", icon: Crown },
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
                    : "text-app-2 hover:bg-[var(--bg-elevated)] hover:text-violet-500 dark:hover:text-violet-400"
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
          <div className="relative">
            <img
              src={user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || "User")}&background=6D5EF9&color=fff`}
              alt={user?.full_name || user?.username || "User"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || "User")}&background=6D5EF9&color=fff`;
              }}
              className="h-10 w-10 rounded-full object-cover shadow-sm group-hover:ring-2 ring-violet-100 transition-all"
            />
            {isPro && (
              <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 p-0.5 rounded-full shadow border border-white" title="Pro Tier">
                <Crown size={10} className="fill-slate-900" />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h4 className="truncate text-sm font-semibold text-app group-hover:text-violet-700 transition-colors">
                {user?.full_name || user?.username || "Student User"}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase border ${
                isPro
                  ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-amber-300 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              }`}>
                {isPro ? "👑 PRO MEMBER" : "Free Tier"}
              </span>
              <span className="text-[10px] text-app-muted truncate font-medium">
                {isPro ? `• ${daysRemaining} days left` : "• Upgrade →"}
              </span>
            </div>
          </div>
          <ChevronDown size={16} className="text-app-muted group-hover:text-violet-500 transition-colors" />
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
