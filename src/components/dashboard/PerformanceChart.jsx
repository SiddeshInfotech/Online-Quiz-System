import { useState } from "react";
import { Target, Award, Zap, Clock, TrendingUp } from "lucide-react";
import Card from "../ui/Card/Card";

const PerformanceChart = ({ stats, chartData, isLoading }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const hasData = chartData && chartData.length > 0;

  // Normalized chart points
  const points = [
    { day: "Sun", score: 20, x: 0, y: 80 },
    { day: "Mon", score: 65, x: 16.6, y: 35 },
    { day: "Tue", score: 40, x: 33.3, y: 60 },
    { day: "Wed", score: 45, x: 50, y: 55 },
    { day: "Thu", score: 55, x: 66.6, y: 45 },
    { day: "Fri", score: 85, x: 83.3, y: 15 },
    { day: "Sat", score: 70, x: 100, y: 30 },
  ];

  return (
    <Card className="p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-app text-base font-space-grotesk flex items-center gap-2">
            Performance Overview
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp size={12} /> +12.4% Progress
            </span>
          </h3>
          <p className="text-xs text-app-muted mt-0.5">Track your accuracy and daily practice consistency</p>
        </div>
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 surface-subtle px-3 py-1.5 rounded-xl border border-violet-500/20 shadow-sm">
          This Week
        </span>
      </div>

      {/* 4 Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse p-4 surface-subtle rounded-2xl border border-app">
              <div className="h-3 w-20 surface-subtle rounded mb-3"></div>
              <div className="h-8 w-16 surface-subtle rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* Quizzes Attempted */}
          <div className="surface-subtle border border-app rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-violet-500/40 hover:shadow-md group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Attempted</span>
              <div className="p-2 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0 group-hover:scale-110 transition-transform">
                <Target size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-space-grotesk text-app mt-1">
                {stats?.quizzesAttempted ?? 31}
              </p>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">↑ +5 this week</span>
            </div>
          </div>

          {/* Average Score */}
          <div className="surface-subtle border border-app rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Avg Score</span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 group-hover:scale-110 transition-transform">
                <Award size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-space-grotesk text-app mt-1">
                {stats?.averageScore ?? 15.5}%
              </p>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">↑ +2.1% improvement</span>
            </div>
          </div>

          {/* Accuracy */}
          <div className="surface-subtle border border-app rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-cyan-500/40 hover:shadow-md group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Accuracy</span>
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0 group-hover:scale-110 transition-transform">
                <Zap size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-space-grotesk text-app mt-1">
                {stats?.accuracy ?? 38.3}%
              </p>
              <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">↑ High accuracy tier</span>
            </div>
          </div>

          {/* Time Spent */}
          <div className="surface-subtle border border-app rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-purple-500/40 hover:shadow-md group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Time Spent</span>
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0 group-hover:scale-110 transition-transform">
                <Clock size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-space-grotesk text-app mt-1">
                {stats?.timeSpent ?? "13m"}
              </p>
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Active daily practice</span>
            </div>
          </div>
        </div>
      )}

      {/* Smooth Area Curve & Non-Stretched Node Dots */}
      <div className="relative flex-1 min-h-[220px] w-full flex items-end pt-4">
        {/* Y Axis Guides */}
        <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-8 z-0 pointer-events-none">
          {[100, 75, 50, 25, 0].map((val) => (
            <div key={val} className="flex items-center gap-2 w-full">
              <span className="text-[10px] font-bold text-app-muted w-7 text-right">{val}%</span>
              <div className="flex-1 h-px bg-app"></div>
            </div>
          ))}
        </div>

        {/* X Axis Labels */}
        <div className="absolute bottom-0 left-9 right-2 flex justify-between z-0 pointer-events-none">
          {points.map((pt) => (
            <span key={pt.day} className="text-[11px] font-bold text-app-muted text-center w-8">
              {pt.day}
            </span>
          ))}
        </div>

        {/* Line Chart & Area */}
        <div className="absolute inset-0 left-9 bottom-7 right-2 top-2 z-10">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="performanceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6D5EF9" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6D5EF9" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Area under curve */}
            <path
              d="M 0 80 C 8 80, 8 35, 16.6 35 C 25 35, 25 60, 33.3 60 C 41.6 60, 41.6 55, 50 55 C 58.3 55, 58.3 45, 66.6 45 C 75 45, 75 15, 83.3 15 C 91.6 15, 91.6 30, 100 30 L 100 100 L 0 100 Z"
              fill="url(#performanceAreaGradient)"
            />

            {/* Smooth Curved Line */}
            <path
              d="M 0 80 C 8 80, 8 35, 16.6 35 C 25 35, 25 60, 33.3 60 C 41.6 60, 41.6 55, 50 55 C 58.3 55, 58.3 45, 66.6 45 C 75 45, 75 15, 83.3 15 C 91.6 15, 91.6 30, 100 30"
              fill="none"
              stroke="#6D5EF9"
              strokeWidth="3.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* HTML Overlay Dots - Perfectly Round & Never Stretched */}
          {points.map((pt, i) => (
            <div
              key={i}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Pulse Ring on active hover */}
              <div className="w-4 h-4 rounded-full bg-violet-600/30 animate-ping absolute -inset-0.5 group-hover:block hidden" />

              {/* Crisp Round Dot */}
              <div className="w-3.5 h-3.5 rounded-full bg-[var(--bg-surface)] border-2 border-violet-600 shadow-md group-hover:scale-125 group-hover:bg-violet-600 group-hover:border-white transition-all duration-200" />

              {/* Interactive Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <div className="bg-slate-900 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap border border-slate-700">
                  {pt.day}: {pt.score}% Score
                </div>
                <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PerformanceChart;
