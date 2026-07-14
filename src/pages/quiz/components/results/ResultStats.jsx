import React from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, XCircle, HelpCircle, Target, Star } from "lucide-react";

const StatCard = ({ icon: Icon, iconColor, value, label, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md hover:border-slate-300 transition-all cursor-default"
  >
    <div className={`w-10 h-10 flex items-center justify-center rounded-xl mb-3 ${iconColor}`}>
      <Icon size={20} />
    </div>
    <span className="text-2xl font-bold font-space-grotesk text-slate-900 leading-none mb-1">
      {value}
    </span>
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </span>
  </motion.div>
);

const ResultStats = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-200 h-32 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (!result) return null;

  const stats = [
    { icon: FileText, iconColor: "bg-slate-100 text-slate-600", value: result.total_questions ?? "--", label: "Questions" },
    { icon: CheckCircle2, iconColor: "bg-emerald-100 text-emerald-600", value: result.correct_answers ?? "--", label: "Correct" },
    { icon: XCircle, iconColor: "bg-red-100 text-red-600", value: result.incorrect_answers ?? "--", label: "Incorrect" },
    { icon: HelpCircle, iconColor: "bg-amber-100 text-amber-600", value: result.unanswered ?? "--", label: "Unanswered" },
    { icon: Target, iconColor: "bg-blue-100 text-blue-600", value: result.accuracy != null ? `${result.accuracy}%` : "--", label: "Accuracy" },
    { icon: Star, iconColor: "bg-violet-100 text-violet-600", value: result.points_earned ?? "--", label: "Points" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((s, i) => (
        <StatCard key={s.label} {...s} delay={0.1 + i * 0.05} />
      ))}
    </div>
  );
};

export default ResultStats;
