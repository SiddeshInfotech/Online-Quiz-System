import { motion } from "framer-motion";

const ProgressBar = ({ current = 0, total = 1, percentage: percentageProp, color = "violet", isCompleted = false }) => {
  const percentage = isCompleted
    ? 100
    : percentageProp !== undefined && percentageProp !== null
    ? Math.min(100, Math.max(0, Math.round(percentageProp)))
    : Math.min(100, Math.max(0, Math.round(((current || 0) / (total || 1)) * 100)));

  const colorStyles = {
    violet: "from-violet-600 to-indigo-500 shadow-violet-500/20",
    emerald: "from-emerald-500 to-teal-400 shadow-emerald-500/20",
    amber: "from-amber-500 to-orange-400 shadow-amber-500/20",
  };

  const gradientClass = colorStyles[color] || colorStyles.violet;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
        <span className="text-slate-400 font-medium">Progress</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-mono text-[11px]">
            {current} / {total}
          </span>
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isCompleted ? 'text-emerald-400 bg-emerald-500/10' : 'text-violet-400 bg-violet-500/10'}`}>
            {isCompleted || percentage >= 100 ? "Completed" : `${percentage}%`}
          </span>
        </div>
      </div>
      <div 
        className="h-2 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${gradientClass} shadow-sm`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
