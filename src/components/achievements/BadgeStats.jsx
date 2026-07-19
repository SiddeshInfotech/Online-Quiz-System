import { motion } from "framer-motion";
import { Zap, CheckCircle2, Sparkles, Target } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="surface rounded-[20px] p-6 shadow-sm border border-app flex items-start gap-4 hover:shadow-md transition-shadow"
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
  if (!stats) return null;
  
  const level = stats.level || 1;
  const xp = stats.total_xp || 0;
  
  const claimedCount = stats.claimed_badges ?? 0;
  const claimableCount = stats.claimable_badges ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        label="Claimed Badges"
        value={claimedCount}
        colorClass="bg-emerald-100 text-emerald-600"
        delay={0.15}
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
  );
};

export default BadgeStats;
