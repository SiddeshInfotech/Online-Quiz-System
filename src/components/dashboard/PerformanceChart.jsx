import { ChevronDown, BarChart2, Activity } from "lucide-react";
import Card from "../ui/Card/Card";
import Button from "../ui/Button/Button";
import { Link } from "react-router-dom";

const PerformanceChart = ({ stats, chartData, isLoading }) => {
  const hasData = chartData && chartData.length > 0;

  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-app-2 text-sm">Performance Overview</h3>
        <button className="flex items-center gap-1 text-xs font-medium text-app-muted hover:text-app-2 surface-subtle px-2.5 py-1.5 rounded-lg border border-app transition-colors">
          This Week <ChevronDown size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 w-16 bg-slate-200 rounded mb-2"></div>
              <div className="h-6 w-12 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div>
            <p className="text-[10px] text-app-muted font-medium mb-1">Quizzes Attempted</p>
            <p className="text-xl font-bold font-space-grotesk text-app">{stats?.quizzesAttempted ?? 0}</p>
          </div>
          <div>
            <p className="text-[10px] text-app-muted font-medium mb-1">Average Score</p>
            <p className="text-xl font-bold font-space-grotesk text-app">{stats?.averageScore ?? 0}%</p>
          </div>
          <div>
            <p className="text-[10px] text-app-muted font-medium mb-1">Accuracy</p>
            <p className="text-xl font-bold font-space-grotesk text-app">{stats?.accuracy ?? 0}%</p>
          </div>
          <div>
            <p className="text-[10px] text-app-muted font-medium mb-1">Time Spent</p>
            <p className="text-xl font-bold font-space-grotesk text-app">{stats?.timeSpent ?? "0h 0m"}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="relative flex-1 min-h-[160px] w-full flex items-end border-b border-slate-100 pb-6 animate-pulse">
          <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-6 z-0">
            {[1, 2, 3, 4, 5].map((val) => (
               <div key={val} className="flex items-center gap-2 w-full">
                 <div className="w-6 h-2 bg-slate-200 rounded"></div>
                 <div className="flex-1 h-px bg-slate-100"></div>
               </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-8 right-0 flex justify-between px-4 z-0">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-2 w-6 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : hasData ? (
        /* SVG Line Chart */
        <div className="relative flex-1 min-h-[160px] w-full flex items-end">
          {/* Y Axis Guides */}
          <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-6 z-0">
            {[100, 75, 50, 25, 0].map((val) => (
              <div key={val} className="flex items-center gap-2 w-full">
                <span className="text-[9px] text-app-muted w-6 text-right">{val}%</span>
                <div className="flex-1 h-px bg-[var(--border)]"></div>
              </div>
            ))}
          </div>

          {/* X Axis Labels */}
          <div className="absolute bottom-0 left-8 right-0 flex justify-between px-4 z-0">
            {chartData.map((d, i) => (
              <span key={i} className="text-[9px] text-app-muted">{d.day}</span>
            ))}
          </div>

          {/* The Line and Area */}
          <div className="absolute inset-0 left-8 bottom-6 pt-2 z-10 flex items-end">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6D5EF9" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6D5EF9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 80 C 8 80, 8 35, 16.6 35 C 25 35, 25 60, 33.3 60 C 41.6 60, 41.6 55, 50 55 C 58.3 55, 58.3 45, 66.6 45 C 75 45, 75 15, 83.3 15 C 91.6 15, 91.6 30, 100 30"
                fill="transparent"
                stroke="#6D5EF9"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 0 80 C 8 80, 8 35, 16.6 35 C 25 35, 25 60, 33.3 60 C 41.6 60, 41.6 55, 50 55 C 58.3 55, 58.3 45, 66.6 45 C 75 45, 75 15, 83.3 15 C 91.6 15, 91.6 30, 100 30 L 100 100 L 0 100 Z"
                fill="url(#chartGradient)"
                vectorEffect="non-scaling-stroke"
              />
              {/* Dots */}
              {[
                 {x: 0, y: 80}, {x: 16.6, y: 35}, {x: 33.3, y: 60}, {x: 50, y: 55},
                 {x: 66.6, y: 45}, {x: 83.3, y: 15}, {x: 100, y: 30}
              ].map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="var(--bg-surface)"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  className="hover:r-[5px] transition-all cursor-pointer shadow-sm"
                />
              ))}
            </svg>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center gap-3 rounded-xl surface-subtle border border-dashed border-app group relative overflow-hidden transition-colors hover:border-violet-200">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-600 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="w-14 h-14 rounded-2xl surface border border-app flex items-center justify-center text-app-muted shadow-sm group-hover:scale-110 group-hover:text-violet-500 group-hover:border-violet-200 transition-all duration-300 z-10">
            <Activity size={26} className="group-hover:animate-pulse" />
          </div>
          <div className="text-center z-10">
            <p className="text-sm font-semibold text-app-2 group-hover:text-violet-700 transition-colors">No performance data yet.</p>
            <p className="text-xs text-app-muted mt-1 max-w-[220px] leading-relaxed">Complete quizzes to unlock your personalized analytics chart here!</p>
          </div>
          <Link to="/library" className="mt-2 z-10">
            <Button variant="outline" size="sm" className="text-xs font-semibold surface hover:border-violet-300 hover:text-violet-700 transition-colors shadow-sm">
              Take a Quiz
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};

export default PerformanceChart;

