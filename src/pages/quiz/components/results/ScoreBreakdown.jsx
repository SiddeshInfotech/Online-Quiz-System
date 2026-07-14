import React from "react";
import { motion } from "framer-motion";

const ScoreBreakdown = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="animate-pulse bg-slate-200 h-6 w-1/3 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-100 h-12 w-full rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const total = result.total_questions || 1; // prevent division by zero
  const correct = result.correct_answers || 0;
  const incorrect = result.incorrect_answers || 0;
  const unanswered = result.unanswered ?? result.unanswered_questions ?? 0;

  const bars = [
    { label: "Correct", value: correct, color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Incorrect", value: incorrect, color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
    { label: "Unanswered", value: unanswered, color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  ];

  return (
    <motion.div 
      className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <h3 className="font-bold text-slate-900 mb-6 font-space-grotesk text-lg">
        Score Breakdown
      </h3>

      <div className="space-y-5">
        {bars.map((bar, i) => {
          const percent = Math.round((bar.value / total) * 100);
          return (
            <div key={bar.label}>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className={bar.text}>{bar.label}</span>
                <span className="text-slate-600">{bar.value} ({percent}%)</span>
              </div>
              <div className={`h-2.5 w-full rounded-full overflow-hidden ${bar.bg}`}>
                <motion.div
                  className={`h-full ${bar.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.4 + i * 0.1 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ScoreBreakdown;
