import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkCheck, XCircle, AlertTriangle } from "lucide-react";

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
  disabled = false,
}) => {
  useEffect(() => {
    if (question && (!question.options || !Array.isArray(question.options) || question.options.length === 0)) {
      console.error(`[QuestionCard] Question (ID: ${question.id || index}) has no options:`, question);
    }
  }, [question, index]);

  if (isLoading) {
    return (
      <div className="surface rounded-3xl p-6 md:p-8 shadow-sm border border-app">
        <div className="flex justify-between items-start mb-6">
          <div className="animate-pulse surface-subtle h-6 w-32 rounded"></div>
          <div className="animate-pulse surface-subtle h-8 w-8 rounded-full"></div>
        </div>
        <div className="animate-pulse surface-subtle h-24 w-full rounded-xl mb-8"></div>
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

  let rawOptions = question.options ?? question.choices ?? question.question_options ?? [];
  if (typeof rawOptions === "string") {
    try {
      const parsed = JSON.parse(rawOptions);
      if (Array.isArray(parsed)) rawOptions = parsed;
    } catch (e) {
      if (rawOptions.trim()) rawOptions = [rawOptions];
    }
  }
  const optionsArray = Array.isArray(rawOptions) ? rawOptions : [];

  return (
    <div className="surface rounded-3xl p-6 md:p-10 shadow-sm border border-app relative overflow-hidden">
      {/* Top action bar */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-app">
        <div className="flex items-center gap-4">
          <h2
            className="text-lg md:text-xl font-bold text-app"
            tabIndex={-1}
            id="question-heading"
          >
            Question {index + 1}
          </h2>
          {reviewMode && (
            <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 ${question.is_correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
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
        {optionsArray.length === 0 ? (
          <div className="p-6 rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 text-center text-amber-700 dark:text-amber-400 font-medium space-y-1">
            <AlertTriangle size={24} className="mx-auto mb-1 opacity-80" />
            <p className="text-sm font-semibold">No options available for this question.</p>
            <p className="text-xs opacity-75">If this issue persists, please contact support or try refreshing.</p>
          </div>
        ) : (
          optionsArray.map((option, i) => {
            const optionText = typeof option === "string" ? option : (option?.text ?? option?.option_text ?? option?.value ?? String(option?.id || ""));
            const optionId = typeof option === "object" && option?.id != null ? String(option.id).trim() : (typeof option === "string" ? option : String(i));
            const letter = String.fromCharCode(65 + i);

            const effectiveSelectedId = question?.selected_option_id ?? question?.user_answer_id ?? selectedOptionId;
            const effectiveSelectedStr = effectiveSelectedId != null ? String(effectiveSelectedId).trim() : null;
            
            // Text-based matching + Index matching + ID matching for high compatibility
            const isSelected = reviewMode
              ? (question.selected_answer
                  ? optionText.trim() === String(question.selected_answer).trim()
                  : (effectiveSelectedStr != null && (effectiveSelectedStr === optionId || effectiveSelectedStr === String(i) || effectiveSelectedStr === optionText.trim())))
              : (effectiveSelectedStr != null && (effectiveSelectedStr === optionId || effectiveSelectedStr === String(i) || effectiveSelectedStr === optionText.trim()));

            const isCorrectOption = reviewMode
              ? (question.correct_answer
                  ? optionText.trim() === String(question.correct_answer).trim()
                  : (question.correct_option_id != null && (String(question.correct_option_id).trim() === optionId || String(question.correct_option_id).trim() === String(i) || String(question.correct_option_id).trim() === optionText.trim())))
              : false;

            let containerClasses = "";
            let circleClasses = "";
            let textClasses = "";
            let indicatorClasses = "";
            let indicatorInnerClasses = "";

            if (reviewMode) {
              if (isCorrectOption) {
                containerClasses = "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/5";
                circleClasses = "bg-emerald-500 border-emerald-500 text-white";
                textClasses = "font-semibold text-emerald-800 dark:text-emerald-300";
                indicatorClasses = "border-emerald-500";
                indicatorInnerClasses = "bg-emerald-500";
              } else if (isSelected && !isCorrectOption) {
                containerClasses = "border-red-500 bg-red-500/10 shadow-md shadow-red-500/5";
                circleClasses = "bg-red-500 border-red-500 text-white";
                textClasses = "font-semibold text-red-800 dark:text-red-300";
                indicatorClasses = "border-red-500";
                indicatorInnerClasses = "bg-red-500";
              } else {
                containerClasses = "border-app surface opacity-60";
                circleClasses = "border-app text-app-muted";
                textClasses = "text-app-muted";
                indicatorClasses = "border-app";
              }
            } else {
              if (isSelected) {
                containerClasses = "border-violet-500 bg-violet-500/10 shadow-md";
                circleClasses = "bg-violet-500 border-violet-500 text-white";
                textClasses = "font-semibold text-violet-700 dark:text-violet-300";
                indicatorClasses = "border-violet-500";
                indicatorInnerClasses = "bg-violet-500";
              } else {
                containerClasses = "border-app surface hover:border-violet-400 hover:bg-[var(--bg-elevated)]";
                circleClasses = "border-app text-app-muted";
                textClasses = "text-app-2";
                indicatorClasses = "border-app";
              }
            }

            const showIndicator = (!reviewMode && isSelected) || (reviewMode && (isCorrectOption || (isSelected && !isCorrectOption)));

            return (
              <motion.button
                key={optionId || i}
                whileHover={reviewMode || disabled ? {} : { scale: 1.01 }}
                whileTap={reviewMode || disabled ? {} : { scale: 0.99 }}
                onClick={() => !reviewMode && !disabled && onSelectOption(optionId)}
                disabled={reviewMode || disabled}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${containerClasses} ${disabled && !reviewMode ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${circleClasses}`}
                >
                  {letter}
                </div>
                <div className="flex-1 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className={`text-base ${textClasses}`}>
                    {optionText}
                  </span>
                  {reviewMode && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSelected && isCorrectOption && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full">
                          ✅ Your Answer (Correct)
                        </span>
                      )}
                      {isSelected && !isCorrectOption && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-full">
                          Your Answer
                        </span>
                      )}
                      {!isSelected && isCorrectOption && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full">
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

      {/* Explanation Card */}
      {reviewMode && (
        <div className="mt-8 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🤖</span>
            <h3 className="font-bold text-indigo-900 dark:text-indigo-400 text-lg">Explanation</h3>
          </div>
          <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
            {question.explanation || question.ai_explanation || "No explanation is available for this question."}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
