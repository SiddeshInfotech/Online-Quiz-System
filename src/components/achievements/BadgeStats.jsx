import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, CheckCircle2, Sparkles, Target, ArrowUpRight } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, borderGlow, delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ duration: 0.3, delay }}
    onClick={onClick}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    }}
    className={`surface rounded-2xl p-5 shadow-lg border border-app flex items-start gap-4 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
      onClick ? `cursor-pointer ${borderGlow || 'hover:border-violet-500/50 hover:shadow-violet-500/10'}` : "hover:border-slate-300 dark:hover:border-slate-700"
    }`}
  >
    <div className={`p-3 rounded-2xl shrink-0 ${colorClass}`}>
      <Icon size={22} strokeWidth={2.5} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-app font-space-grotesk truncate">{value}</h4>
      {subtext && <p className="text-xs font-medium text-app-muted mt-1 truncate">{subtext}</p>}
    </div>
    {onClick && <ArrowUpRight size={16} className="text-app-muted shrink-0 mt-1" />}
  </motion.div>
);

const BadgeStats = ({ stats, onScrollToClaimable }) => {
  const navigate = useNavigate();
  if (!stats) return null;
  
  const level = stats.level || 1;
  const currentXp = stats.current_xp ?? stats.total_xp ?? 0;
  const nextLevelXp = stats.next_level_xp ?? (level * 100);
  const remainingXp = stats.remaining_xp ?? Math.max(0, nextLevelXp - currentXp);

  // Derive starting base XP for current level range
  const prevLevelXp = stats.prev_level_xp ?? stats.start_level_xp ?? (
    stats.current_level_xp !== undefined && stats.current_level_xp !== null && stats.current_level_xp < nextLevelXp
      ? stats.current_level_xp
      : (nextLevelXp > 0 ? Math.round(nextLevelXp - (nextLevelXp / level)) : 0)
  );

  const levelSpan = Math.max(1, nextLevelXp - prevLevelXp);
  const currentLevelProgress = Math.max(0, currentXp - prevLevelXp);

  // Calculate exact percentage progress inside current level range
  const xpPercentage = Math.min(100, Math.max(0, Math.round((currentLevelProgress / levelSpan) * 100)));
  
  const claimedCount = stats.claimed_badges ?? 0;
  const claimableCount = stats.claimable_badges ?? 0;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Level Badge */}
        <StatCard
          icon={Target}
          label="Level Badge"
          value={`Level ${level}`}
          subtext={`Next Level in ${remainingXp.toLocaleString()} XP`}
          colorClass="bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30"
          delay={0.05}
        />

        {/* Card 2: Total XP */}
        <StatCard
          icon={Zap}
          label="Total XP"
          value={`${currentXp.toLocaleString()} XP`}
          subtext={`${remainingXp.toLocaleString()} XP remaining`}
          colorClass="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
          delay={0.1}
        />

        {/* Card 3: Claimed Badges */}
        <StatCard
          icon={CheckCircle2}
          label="Claimed Badges"
          value={claimedCount}
          subtext="Click to view all badges"
          colorClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
          borderGlow="hover:border-emerald-500/50 hover:shadow-emerald-500/10"
          delay={0.15}
          onClick={() => navigate("/profile/badges")}
        />

        {/* Card 4: Claimable Badges */}
        <StatCard
          icon={Sparkles}
          label="Claimable"
          value={claimableCount}
          subtext={claimableCount > 0 ? "Ready to unlock!" : "No rewards ready"}
          colorClass="bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30"
          borderGlow="hover:border-fuchsia-500/50 hover:shadow-fuchsia-500/10"
          delay={0.2}
          onClick={onScrollToClaimable}
        />
      </div>

      {/* Level XP Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="surface rounded-2xl p-5 shadow-lg border border-app relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              Level {level}
            </span>
            <h4 className="text-base font-bold text-app font-space-grotesk">
              Progress to Level {level + 1}
            </h4>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-app-muted">
            <div>
              Current XP: <span className="text-app font-bold">{currentXp.toLocaleString()}</span> / Next Level: <span className="text-app font-bold">{nextLevelXp.toLocaleString()}</span>
              <span className="ml-2 text-violet-600 dark:text-violet-400 font-semibold">({remainingXp.toLocaleString()} XP Remaining)</span>
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div
          className="w-full h-3.5 bg-slate-200 dark:bg-slate-950 rounded-full p-0.5 border border-slate-300 dark:border-slate-800 overflow-hidden relative"
          role="progressbar"
          aria-valuenow={xpPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress to Level ${level + 1}: ${xpPercentage}%`}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 rounded-full shadow-lg shadow-violet-500/30"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default BadgeStats;
