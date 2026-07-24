import React from "react";
import { X, Clock, Send } from "lucide-react";

const QuizHeader = ({
  quizTitle,
  currentQuestionIndex,
  totalQuestions,
  remainingSeconds,
  onExit,
  onSubmitQuiz,
  isLoading,
  exitText = "Exit",
}) => {
  // Skeleton loader
  if (isLoading) {
    return (
      <div className="sticky top-0 z-40 surface border-b border-app px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="animate-pulse surface-elev h-6 w-1/3 rounded mb-2"></div>
            <div className="animate-pulse surface-elev h-3 w-1/4 rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="animate-pulse surface-elev h-10 w-24 rounded-lg"></div>
            <div className="animate-pulse surface-elev h-10 w-10 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Format time
  const formatTime = (seconds) => {
    if (seconds == null || isNaN(seconds)) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const percentComplete =
    totalQuestions > 0
      ? Math.round((currentQuestionIndex / totalQuestions) * 100)
      : 0;

  const isLowTime = remainingSeconds !== null && remainingSeconds < 300; // Less than 5 mins

  return (
    <header className="sticky top-0 z-40 surface border-b border-app px-4 py-3 md:px-8 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Title & Progress */}
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold font-space-grotesk text-app truncate">
            {quizTitle || "Quiz Attempt"}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-semibold text-app-muted">
              Question {totalQuestions > 0 ? currentQuestionIndex + 1 : 0} of {totalQuestions}
            </span>
            <div className="h-1.5 flex-1 max-w-[120px] surface-elev rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 hidden sm:block">
              {percentComplete}% Completed
            </span>
          </div>
        </div>

        {/* Right: Timer & Exit */}
        <div className="flex items-center gap-3 md:gap-5">
          {remainingSeconds !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border ${
                isLowTime
                  ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                  : "surface-subtle border-app text-app-2"
              }`}
            >
              <Clock size={16} className={isLowTime ? "animate-pulse" : ""} />
              <span className="font-mono font-bold tracking-tight text-sm md:text-base">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          )}
          
          {onSubmitQuiz && (
            <button
              onClick={onSubmitQuiz}
              disabled={isLoading}
              className="flex items-center justify-center px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs md:text-sm shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Submit Quiz Early"
            >
              <Send size={15} className="mr-1.5" />
              <span>Submit Quiz</span>
            </button>
          )}

          <button
            onClick={onExit}
            className="flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-xl text-app-muted hover:text-app hover:bg-[var(--bg-elevated)] transition-colors font-medium text-sm border border-transparent"
            aria-label={exitText}
          >
            <X size={18} className="md:mr-1.5" />
            <span className="hidden md:inline">{exitText}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default QuizHeader;
