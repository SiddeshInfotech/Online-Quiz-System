import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const PerformanceSummary = ({ percentage, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="animate-pulse bg-slate-200 h-6 w-1/3 rounded mb-4"></div>
        <div className="animate-pulse bg-slate-200 h-4 w-full rounded-full"></div>
      </div>
    );
  }

  let message = "";
  let colorClass = "";
  let barClass = "";

  if (percentage >= 90) {
    message = "Excellent Performance! Outstanding mastery of the subject.";
    colorClass = "text-emerald-700 bg-emerald-50 border-emerald-100";
    barClass = "bg-emerald-500";
  } else if (percentage >= 75) {
    message = "Good Job! You have a solid grasp of the material.";
    colorClass = "text-blue-700 bg-blue-50 border-blue-100";
    barClass = "bg-blue-500";
  } else if (percentage >= 60) {
    message = "Average. There's room for improvement in some areas.";
    colorClass = "text-amber-700 bg-amber-50 border-amber-100";
    barClass = "bg-amber-500";
  } else {
    message = "Needs Improvement. Review the material and try again.";
    colorClass = "text-red-700 bg-red-50 border-red-100";
    barClass = "bg-red-500";
  }

  return (
    <motion.div 
      className={`rounded-3xl p-6 md:p-8 shadow-sm border ${colorClass}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center shadow-sm">
          <TrendingUp size={20} className="opacity-80" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg leading-none mb-1">Performance Summary</h3>
          <p className="text-sm font-medium opacity-90">{message}</p>
        </div>
      </div>

      <div className="h-4 bg-white/50 rounded-full overflow-hidden shadow-inner border border-black/5">
        <motion.div
          className={`h-full ${barClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
};

export default PerformanceSummary;
