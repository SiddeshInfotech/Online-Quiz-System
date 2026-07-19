import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkCheck, XCircle } from "lucide-react";

const QuestionCard = ({
  question,
  index,
  selectedOptionId,
  isMarkedForReview,
  onSelectOption,
  onClearAnswer,
  onToggleReview,
  isLoading,
  reviewMode = false,
}) => {
  if (isLoading) {
    return (
      <div className="surface rounded-3xl p-6 md:p-8 shadow-sm border border-app">
        <div className="flex justify-between items-start mb-6">
          <div className="animate-pulse bg-slate-200 h-6 w-32 rounded"></div>
          <div className="animate-pulse bg-slate-200 h-8 w-8 rounded-full"></div>
        </div>
        <div className="animate-pulse bg-slate-200 h-24 w-full rounded-xl mb-8"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse surface-elev h-16 w-full rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!question) return null;

  const isCoding =
    question.question_type === "Coding" ||
    question.quiz_mode === "Coding" ||
    question.type === "Coding";

  const renderQuestionText = () => {
    const rawText = question.question_text || question.text || "";

    if (!isCoding) {
      return (
        <p className="text-app text-lg leading-relaxed font-medium">
          {rawText}
        </p>
      );
    }

    const codeBlockRegex = /```(.*?)\n([\s\S]*?)```/;
    const match = rawText.match(codeBlockRegex);

    if (match) {
      const fullMatch = match[0];
      // Optional: language = match[1].trim()
      const code = match[2];
      const description = rawText.replace(fullMatch, "").trim();

      return (
        <div className="flex flex-col gap-4">
          {description && (
            <p className="text-app text-lg leading-relaxed font-medium whitespace-pre-wrap">
              {description}
            </p>
          )}
          <div className="bg-[#1e1e1e] text-slate-50 rounded-xl p-4 md:p-5 overflow-x-auto shadow-inner border border-slate-800">
            <pre className="font-mono text-sm leading-relaxed whitespace-pre">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      );
    }

    return (
      <p className="text-app text-lg leading-relaxed font-medium whitespace-pre-wrap">
        {rawText}
      </p>
    );
  };

  return (
    <div className="surface rounded-3xl p-6 md:p-10 shadow-sm border border-app relative overflow-hidden">
      {/* Top action bar */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h2
            className="text-lg md:text-xl font-bold text-app"
            tabIndex={-1}
            id="question-heading"
          >
            Question {index + 1}
          </h2>
          {reviewMode && (
            <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 ${question.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {question.is_correct ? '✅ Correct' : '❌ Incorrect'}
            </div>
          )}
        </div>
        {!reviewMode && (
          <div className="flex items-center gap-2">
            {selectedOptionId && (
              <button
                onClick={onClearAnswer}
                className="text-xs font-medium text-app-muted hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Clear Answer"
              >
                <XCircle size={14} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              onClick={onToggleReview}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${isMarkedForReview
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "text-app-muted hover:bg-[var(--bg-elevated)] hover:text-app"
                }`}
              title={isMarkedForReview ? "Unmark for Review" : "Mark for Review"}
            >
              {isMarkedForReview ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              <span className="hidden sm:inline">
                {isMarkedForReview ? "Marked" : "Review"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Question Text */}
      <div className="prose prose-slate max-w-none mb-8">
        {renderQuestionText()}
        {question.image_url && (
          <img
            src={question.image_url}
            alt="Question visual"
            className="mt-4 max-h-64 rounded-xl object-contain"
          />
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {!question.options || question.options.length === 0 ? (
          <div className="p-6 rounded-2xl border-2 border-dashed border-app text-center text-app-muted font-medium">
            Waiting for options from the backend...
          </div>
        ) : (
          question.options.map((option, i) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrectOption = option.id === question.correct_option_id;
            const letter = String.fromCharCode(65 + i);

            let containerClasses = "";
            let circleClasses = "";
            let textClasses = "";
            let indicatorClasses = "";
            let indicatorInnerClasses = "";

            if (reviewMode) {
              if (isCorrectOption) {
                containerClasses = "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100";
                circleClasses = "bg-emerald-500 border-emerald-500 text-white";
                textClasses = "font-semibold text-emerald-900";
                indicatorClasses = "border-emerald-500";
                indicatorInnerClasses = "bg-emerald-500";
              } else if (isSelected && !isCorrectOption) {
                containerClasses = "border-red-500 bg-red-50 shadow-md shadow-red-100";
                circleClasses = "bg-red-500 border-red-500 text-white";
                textClasses = "font-semibold text-red-900";
                indicatorClasses = "border-red-500";
                indicatorInnerClasses = "bg-red-500";
              } else {
                containerClasses = "border-slate-100 surface opacity-60";
                circleClasses = "border-app text-app-muted";
                textClasses = "text-app-muted";
                indicatorClasses = "border-slate-300";
              }
            } else {
              if (isSelected) {
                containerClasses = "border-violet-500 bg-violet-50 shadow-md shadow-violet-100";
                circleClasses = "bg-violet-500 border-violet-500 text-white";
                textClasses = "font-semibold text-violet-900";
                indicatorClasses = "border-violet-500";
                indicatorInnerClasses = "bg-violet-500";
              } else {
                containerClasses = "border-slate-100 surface hover:border-violet-200 hover:bg-slate-50";
                circleClasses = "border-app text-app-muted";
                textClasses = "text-app-2";
                indicatorClasses = "border-slate-300";
              }
            }

            const showIndicator = (!reviewMode && isSelected) || (reviewMode && (isCorrectOption || (isSelected && !isCorrectOption)));

            return (
              <motion.button
                key={option.id}
                whileHover={reviewMode ? {} : { scale: 1.01 }}
                whileTap={reviewMode ? {} : { scale: 0.99 }}
                onClick={() => !reviewMode && onSelectOption(option.id)}
                disabled={reviewMode}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${containerClasses}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${circleClasses}`}
                >
                  {letter}
                </div>
                <div className="flex-1 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className={`text-base ${textClasses}`}>
                    {option.text}
                  </span>
                  {reviewMode && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSelected && isCorrectOption && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                          ✅ Your Answer (Correct)
                        </span>
                      )}
                      {isSelected && !isCorrectOption && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">
                          Your Answer
                        </span>
                      )}
                      {!isSelected && isCorrectOption && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Radio indicator */}
                <div className="flex-shrink-0 mt-1.5 ml-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${indicatorClasses}`}>
                    <AnimatePresence>
                      {showIndicator && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className={`w-2.5 h-2.5 rounded-full ${indicatorInnerClasses}`}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.button>
            );
          }))}
      </div>

      {/* AI Explanation Card */}
      {reviewMode && (
        <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🤖</span>
            <h3 className="font-bold text-indigo-900 text-lg">AI Explanation</h3>
          </div>
          <p className="text-indigo-800 leading-relaxed whitespace-pre-wrap">
            {question.ai_explanation || "No explanation is available for this question."}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
