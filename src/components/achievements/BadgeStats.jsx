import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, CheckCircle2, Sparkles, Target } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    onClick={onClick}
    className={`surface rounded-[20px] p-6 shadow-sm border border-app flex items-start gap-4 transition-all ${
      onClick ? "cursor-pointer hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 hover:-translate-y-0.5" : "hover:shadow-md"
    }`}
  >
    <div className={`p-3 rounded-2xl ${colorClass}`}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <div>
      <p className="text-sm font-medium text-app-muted mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-app">{value}</h4>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  </motion.div>
);

const BadgeStats = ({ stats }) => {
  const navigate = useNavigate();
  if (!stats) return null;
  
  const level = stats.level || 1;
  const currentXp = stats.current_xp ?? stats.total_xp ?? 0;
  const nextLevelXp = stats.next_level_xp ?? 1000;
  const currentLevelXp = stats.current_level_xp ?? 0;
  const remainingXp = stats.remaining_xp ?? Math.max(0, nextLevelXp - currentXp);

  // Exact level progress formula required: (current_xp - current_level_xp) / (next_level_xp - current_level_xp)
  const levelXpSpan = Math.max(1, nextLevelXp - currentLevelXp);
  const currentProgressXp = Math.max(0, currentXp - currentLevelXp);
  const xpPercentage = Math.min(100, Math.max(0, Math.round((currentProgressXp / levelXpSpan) * 100)));
  
  const claimedCount = stats.claimed_badges ?? 0;
  const claimableCount = stats.claimable_badges ?? 0;

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Level Badge"
          value={`Level ${level}`}
          subtext={`${currentLevelXp} → ${nextLevelXp} XP`}
          colorClass="bg-violet-100 text-violet-600"
          delay={0.05}
        />
        <StatCard
          icon={Zap}
          label="Total XP"
          value={currentXp.toLocaleString()}
          subtext={`${remainingXp} XP remaining`}
          colorClass="bg-amber-100 text-amber-600"
          delay={0.1}
        />
        <StatCard
          icon={CheckCircle2}
          label="Claimed Badges"
          value={claimedCount}
          subtext="Click to view all badges"
          colorClass="bg-emerald-100 text-emerald-600"
          delay={0.15}
          onClick={() => navigate("/profile/badges")}
        />
        <StatCard
          icon={Sparkles}
          label="Claimable"
          value={claimableCount}
          subtext="Ready to unlock!"
          colorClass="bg-fuchsia-100 text-fuchsia-600"
          delay={0.2}
        />
      </div>

      {/* Level XP Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="surface rounded-[20px] p-6 shadow-sm border border-app"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-600 text-white shadow-sm">
              Level {level}
            </span>
            <h4 className="text-sm font-semibold text-app">Level Progress</h4>
            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
              {xpPercentage}%
            </span>
          </div>
          <div className="text-xs font-medium text-app-muted">
            <span className="text-violet-600 font-bold">{currentXp}</span> / {nextLevelXp} XP ({remainingXp} XP left to Level {level + 1})
          </div>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default BadgeStats;
