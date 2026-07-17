import { motion } from "framer-motion";
import { Award, Zap, CheckCircle2, Lock, Sparkles, Target } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow"
  >
    <div className={`p-3 rounded-2xl ${colorClass}`}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  </motion.div>
);

const BadgeStats = ({ stats, totalBadges }) => {
  if (!stats) return null;
  
  const level = stats.level || 1;
  const xp = stats.xp || 0;
  
  // Use what backend returns or fallback
  const earnedCount = stats.earned !== undefined ? stats.earned : (stats.earnedBadges || 0);
  const totalCount = stats.total !== undefined ? stats.total : (totalBadges || 1);
  const claimableCount = stats.claimable !== undefined ? stats.claimable : (stats.claimableBadges || 0);
  
  const completionPercent = totalCount > 0 
    ? Math.round((earnedCount / totalCount) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <StatCard
        icon={Target}
        label="Level"
        value={`Level ${level}`}
        colorClass="bg-violet-100 text-violet-600"
        delay={0.05}
      />
      <StatCard
        icon={Zap}
        label="Total XP"
        value={xp.toLocaleString()}
        subtext="Experience Points"
        colorClass="bg-amber-100 text-amber-600"
        delay={0.1}
      />
      <StatCard
        icon={CheckCircle2}
        label="Earned Badges"
        value={earnedCount}
        colorClass="bg-emerald-100 text-emerald-600"
        delay={0.15}
      />
      <StatCard
        icon={Award}
        label="Completion"
        value={`${completionPercent}%`}
        subtext={`${earnedCount} / ${totalCount}`}
        colorClass="bg-blue-100 text-blue-600"
        delay={0.2}
      />
      <StatCard
        icon={Sparkles}
        label="Claimable"
        value={claimableCount}
        subtext="Ready to unlock!"
        colorClass="bg-fuchsia-100 text-fuchsia-600"
        delay={0.25}
      />
    </div>
  );
};

export default BadgeStats;
