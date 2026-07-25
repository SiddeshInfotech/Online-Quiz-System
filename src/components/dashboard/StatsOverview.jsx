import { Flame, Target } from "lucide-react";
import Card from "../ui/Card/Card";

export const DailyStreakCard = ({ user }) => {
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const streak = user?.streak || 0;
  const activeDays = weekDays.map((_, idx) => idx >= weekDays.length - streak);

  return (
    <Card hover className="p-5 sm:p-6 flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-500 shrink-0">
            <Flame className="text-orange-500 fill-orange-500" size={18} />
          </div>
          <h3 className="font-bold text-app-2 text-sm font-space-grotesk">Daily Streak</h3>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-bold font-space-grotesk text-app">{streak}</span>
            <span className="text-app-muted text-sm font-semibold">days</span>
          </div>
          {streak === 0 ? (
            <p className="text-xs text-app-muted mt-1 font-medium">Start a quiz to begin your streak!</p>
          ) : (
            <p className="text-xs text-app-muted mt-1 font-medium">Best: {user?.maxStreak || streak} days</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-auto pt-4 border-t border-app/60">
        {weekDays.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <div 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                activeDays[idx]
                  ? "bg-violet-600 shadow-md shadow-violet-600/40 ring-2 ring-violet-500/30 scale-105"
                  : "bg-[var(--bg-elevated)] border border-app"
              }`} 
            />
            <span className={`text-xs font-bold ${activeDays[idx] ? 'text-violet-600 dark:text-violet-400' : 'text-app-muted'}`}>
              {day}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const OverallProgressCard = ({ user }) => {
  const progressPercent = Math.min(100, Math.max(0, Number(user?.progress || 0)));
  const completed = user?.completedQuizzes ?? 0;
  const total = user?.totalQuizzes ?? 0;

  return (
    <Card hover className="p-5 sm:p-6 flex flex-col justify-between items-center text-center h-full border-app">
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-400 shrink-0">
            <Target size={18} />
          </div>
          <h3 className="font-bold text-app-2 text-sm font-space-grotesk text-left">Overall Progress</h3>
        </div>
      </div>
      
      {/* Enlarged SVG Circular Progress Indicator */}
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center my-auto py-1">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="var(--border)"
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#6D5EF9"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressPercent / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold font-space-grotesk text-app">{progressPercent}%</span>
          <span className="text-xs text-app-muted font-bold uppercase tracking-wider mt-0.5">Completed</span>
        </div>
      </div>

      <div className="w-full pt-3 border-t border-app/60 text-center mt-auto">
        {completed === 0 ? (
          <p className="text-sm font-semibold text-app-muted">
            No quizzes completed yet
          </p>
        ) : (
          <p className="text-sm font-semibold text-app-2">
            <span className="text-violet-600 dark:text-violet-400 font-bold">{completed}</span> of {total} quizzes
          </p>
        )}
      </div>
    </Card>
  );
};

const StatsOverview = ({ user }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
      <DailyStreakCard user={user} />
      <OverallProgressCard user={user} />
    </div>
  );
};

export default StatsOverview;
