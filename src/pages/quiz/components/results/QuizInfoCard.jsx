import React from "react";
import { motion } from "framer-motion";
import { BookOpen, AlertTriangle, Hash, Clock, Target, CheckSquare } from "lucide-react";

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-2 text-slate-500">
      <Icon size={16} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="text-sm font-semibold text-slate-800">{value}</span>
  </div>
);

const QuizInfoCard = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="animate-pulse bg-slate-200 h-6 w-1/3 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-100 h-6 w-full rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <motion.div
      className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <h3 className="font-bold text-slate-900 mb-4 font-space-grotesk text-lg">
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
      </div>
    </motion.div>
  );
};

export default QuizInfoCard;
