import React from "react";
import { motion } from "framer-motion";
import { BookOpen, AlertTriangle, Hash, Clock, Target, CheckSquare, RotateCcw } from "lucide-react";

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-app last:border-0">
    <div className="flex items-center gap-2 text-app-muted">
      <Icon size={16} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="text-sm font-semibold text-app">{value}</span>
  </div>
);

const QuizInfoCard = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="surface rounded-3xl p-6 shadow-sm border border-app">
        <div className="animate-pulse surface-elev h-6 w-1/3 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse surface-elev h-6 w-full rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const attemptCount = result.attempt_count ?? result.quiz?.attempt_count ?? null;
  const maxAttempts = result.max_attempts ?? result.quiz?.max_attempts ?? null;
  const attemptsDisplay = maxAttempts != null 
    ? `${attemptCount ?? 1} / ${maxAttempts}` 
    : (attemptCount != null ? `${attemptCount}` : "--");

  return (
    <motion.div
      className="surface rounded-3xl p-6 md:p-8 shadow-sm border border-app"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <h3 className="font-bold text-app mb-4 font-space-grotesk text-lg">
        Quiz Details
      </h3>

      <div className="flex flex-col">
        <InfoRow
          icon={BookOpen}
          label="Subject"
          value={result.quiz?.category ?? "--"}
        />

        <InfoRow
          icon={AlertTriangle}
          label="Difficulty"
          value={
            result.quiz?.difficulty
              ? result.quiz.difficulty.charAt(0).toUpperCase() +
              result.quiz.difficulty.slice(1)
              : "--"
          }
        />

        <InfoRow
          icon={Hash}
          label="Total Questions"
          value={result.total_questions ?? "--"}
        />

        <InfoRow
          icon={Clock}
          label="Time Limit"
          value={
            result.quiz?.time_limit_minutes
              ? `${result.quiz.time_limit_minutes} min`
              : "--"
          }
        />

        <InfoRow
          icon={Target}
          label="Passing Marks"
          value={result.quiz?.passing_marks ?? "--"}
        />

        <InfoRow
          icon={CheckSquare}
          label="Marks per Question"
          value={result.quiz?.marks_per_question ?? "--"}
        />

        <InfoRow
          icon={RotateCcw}
          label="Attempts Used"
          value={attemptsDisplay}
        />
      </div>
    </motion.div>
  );
};

export default QuizInfoCard;
