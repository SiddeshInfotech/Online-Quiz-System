import { motion } from "framer-motion";

const ProgressBar = ({ current, total, color = "violet" }) => {
  const percentage = Math.min((current / total) * 100, 100) || 0;

  const colorStyles = {
    violet: "bg-violet-600 shadow-violet-600/30",
    emerald: "bg-emerald-500 shadow-emerald-500/30",
    fuchsia: "bg-fuchsia-600 shadow-fuchsia-600/30",
  };

  const bgClass = colorStyles[color] || colorStyles.violet;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs font-medium mb-1.5">
        <span className="text-slate-500">Progress</span>
        <span className="text-slate-700">
          {current} / {total}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full shadow-sm ${bgClass}`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
