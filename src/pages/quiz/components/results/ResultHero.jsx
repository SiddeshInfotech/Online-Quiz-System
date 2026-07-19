import React from "react";
import { motion } from "framer-motion";
import { Award, Clock, Calendar, AlertCircle } from "lucide-react";

const ResultHero = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="surface rounded-3xl p-8 md:p-10 shadow-sm border border-app">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
          <div className="flex-1 space-y-4 w-full">
            <div className="animate-pulse surface-elev h-10 w-3/4 rounded-xl"></div>
            <div className="animate-pulse surface-elev h-6 w-1/4 rounded-lg"></div>
            <div className="flex gap-4 mt-6">
              <div className="animate-pulse surface-elev h-10 w-32 rounded-lg"></div>
              <div className="animate-pulse surface-elev h-10 w-32 rounded-lg"></div>
            </div>
          </div>
          <div className="w-40 h-40 shrink-0">
            <div className="animate-pulse surface-elev w-full h-full rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isPass = result.passed ?? (result.score >= (result.quiz?.passing_marks ?? 0));
  const percentage = result.percentage ?? 0;
  const score = result.score ?? 0;
  const totalScore = result.total_questions ?? "--";
  
  // Format dates/times
  const dateStr = result.submitted_at ? new Date(result.submitted_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : "Just now";
  
  const timeTaken = result.time_spent_seconds;
  const timeTakenStr = timeTaken != null ? `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s` : "--";

  // Circular progress math
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="surface rounded-3xl p-8 md:p-10 shadow-sm border border-app relative overflow-hidden">
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isPass ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} />

      <div className="flex flex-col md:flex-row gap-10 items-center md:items-center justify-between">
        
        {/* Left: Info */}
        <div className="flex-1 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-4 border ${
              isPass 
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" 
                : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
            }`}>
              {isPass ? (
                <><Award size={14} /> Passed</>
              ) : (
                <><AlertCircle size={14} /> Failed</>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold font-space-grotesk text-app mb-2 leading-tight">
              {result.quiz_title || result.quiz?.title || "Quiz Results"}
            </h1>
            
            <p className="text-app-muted text-lg mb-6">
              Final Score: <span className="font-bold text-app">{score} / {totalScore}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-app-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-app-muted" />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-app-muted" />
                <span>Time Taken: <span className="font-semibold text-app">{timeTakenStr}</span></span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Circular Progress */}
        <motion.div 
          className="relative w-40 h-40 shrink-0 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              className={isPass ? "text-emerald-500" : "text-red-500"}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            />
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-space-grotesk text-app leading-none">
              {percentage}%
            </span>
            <span className="text-xs font-semibold text-app-muted uppercase tracking-widest mt-1">
              Score
            </span>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ResultHero;
