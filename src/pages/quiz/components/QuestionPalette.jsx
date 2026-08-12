import React from "react";
import { Bookmark, Send } from "lucide-react";
import Button from "../../../components/ui/Button";

const QuestionPalette = ({
  totalQuestions,
  currentQuestionIndex,
  answers,
  markedForReview,
  onNavigate,
  onSubmitQuiz,
  isLoading,
  reviewMode = false,
  questions = [],
}) => {
  if (isLoading) {
    return (
      <div className="surface rounded-3xl p-6 shadow-sm border border-app">
        <div className="animate-pulse surface-elev h-6 w-32 rounded mb-6"></div>
        <div className="grid grid-cols-5 gap-2">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="animate-pulse surface-elev h-10 w-10 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Legend
  const legend = reviewMode ? [
    { label: "Correct", className: "bg-emerald-500" },
    { label: "Incorrect", className: "bg-red-500" },
  ] : [
    { label: "Answered", className: "bg-emerald-500" },
    { label: "Unanswered", className: "surface-elev border border-app" },
    { label: "Marked", className: "bg-amber-500" },
  ];

  return (
    <div className="surface rounded-3xl p-6 shadow-sm border border-app">
      <h3 className="font-bold text-app mb-6 font-space-grotesk text-lg">
        Question Palette
      </h3>

      <div className="grid grid-cols-5 gap-2 mb-8">
        {[...Array(totalQuestions)].map((_, i) => {
          const isCurrent = currentQuestionIndex === i;
          const qId = questions[i]?.id;
          const isAnswered = qId ? answers[qId] !== undefined : false;
          const isMarked = !!markedForReview[i];

          // Determine button style based on states
          let btnClass = "border-2 border-app surface text-app-2 hover:border-app";
          let showMarked = false;
          
          if (reviewMode) {
             const isCorrect = questions[i]?.is_correct;
             if (isCurrent) {
               btnClass = "border-2 border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-300 font-bold shadow-sm ring-2 ring-violet-500/30";
             } else if (isCorrect) {
               btnClass = "border-2 border-emerald-500 bg-emerald-500 text-white font-medium";
             } else {
               btnClass = "border-2 border-red-500 bg-red-500 text-white font-medium";
             }
          } else {
            if (isCurrent) {
              btnClass = "border-2 border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-300 font-bold shadow-sm ring-2 ring-violet-500/30";
            } else if (isAnswered && isMarked) {
              btnClass = "border-2 border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-[inset_0_-4px_0_rgba(245,158,11,1)]";
            } else if (isAnswered) {
              btnClass = "border-2 border-emerald-500 bg-emerald-500 text-white font-medium";
            } else if (isMarked) {
              btnClass = "border-2 border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium";
            }
            showMarked = isMarked && !isCurrent;
          }

          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`relative h-10 w-10 rounded-xl flex items-center justify-center text-sm transition-all duration-200 ${btnClass}`}
              aria-label={`Question ${i + 1}`}
              aria-current={isCurrent ? "true" : "false"}
            >
              {i + 1}
              {showMarked && (
                <div className="absolute -top-1 -right-1 surface rounded-full p-0.5 shadow-sm">
                  <Bookmark size={10} className="text-amber-500 fill-amber-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 pt-6 border-t border-app">
        <h4 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2">
          Legend
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.className}`} />
              <span className="text-xs font-medium text-app-2">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!reviewMode && onSubmitQuiz && currentQuestionIndex < totalQuestions - 1 && (
        <div className="pt-5 mt-5 border-t border-app">
          <Button
            variant="primary"
            onClick={onSubmitQuiz}
            disabled={isLoading}
            className="w-full justify-center gap-2 shadow-md shadow-violet-500/20"
          >
            <Send size={16} />
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionPalette;
