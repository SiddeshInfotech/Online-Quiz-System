import { Flame } from "lucide-react";
import Card from "../ui/Card/Card";

const StatsOverview = ({ user }) => {
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  // Derive active days from streak: last N days are active
  const streak = user.streak || 0;
  const activeDays = weekDays.map((_, idx) => idx >= weekDays.length - streak);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
      {/* Daily Streak Card */}
      <Card hover className="p-6 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="text-orange-500 fill-orange-500" size={20} />
          <h3 className="font-semibold text-app-2 text-sm">Daily Streak</h3>
        </div>
        
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold font-space-grotesk text-app">{streak}</span>
            <span className="text-app-muted text-sm">days</span>
          </div>
          {streak === 0 ? (
            <p className="text-xs text-app-muted mt-1">Start a quiz to begin your streak!</p>
          ) : (
            <p className="text-xs text-app-muted mt-1">Best: {user.maxStreak} days</p>
          )}
        </div>

        <div className="flex justify-between items-center mt-auto">
          {weekDays.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div 
                className={`w-3 h-3 rounded-full ${
                  activeDays[idx] ? "bg-violet-600 shadow-sm shadow-violet-600/30" : "bg-[var(--bg-elevated)]"
                }`} 
              />
              <span className="text-[10px] font-medium text-app-muted">{day}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Overall Progress Card */}
      <Card hover className="p-6 flex flex-col justify-between items-center text-center">
        <h3 className="font-semibold text-app-2 text-sm self-start mb-4">Overall Progress</h3>
        
        {/* Simple SVG Circular Progress */}
        <div className="relative w-28 h-28 flex items-center justify-center my-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="var(--border)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#6D5EF9"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - (user.progress || 0) / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-space-grotesk text-app">{user.progress || 0}%</span>
            <span className="text-[10px] text-app-muted font-medium">Completed</span>
          </div>
        </div>

        {user.completedQuizzes === 0 ? (
          <p className="text-xs text-app-muted font-medium mt-4 self-start">
            No quizzes completed yet
          </p>
        ) : (
          <p className="text-xs text-app-muted font-medium mt-4 self-start">
            {user.completedQuizzes} of {user.totalQuizzes} quizzes
          </p>
        )}
      </Card>
    </div>
  );
};

export default StatsOverview;

