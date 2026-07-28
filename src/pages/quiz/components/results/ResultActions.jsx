import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, BookOpen, ArrowLeft, Lock } from "lucide-react";
import Button from "../../../../components/ui/Button";

const ResultActions = ({
  isPro = false,
  canRetry = false,
  attemptCount = 1,
  maxAttempts = 1,
  onRetry,
  onReview,
  onBackToLibrary,
  isLoading,
  returnLabel = "Back to Dashboard",
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <div className="animate-pulse surface-elev h-12 flex-1 rounded-xl"></div>
        <div className="animate-pulse surface-elev h-12 flex-1 rounded-xl"></div>
        <div className="animate-pulse surface-elev h-12 flex-1 rounded-xl"></div>
      </div>
    );
  }

  const handleRetry = async () => {
    if (!isPro) {
      window.dispatchEvent(
        new CustomEvent("subscription:premium-required", {
          detail: {
            message: "Quiz retries are exclusive to QuizGen Pro members (1 retry allowed per quiz). Upgrade to Pro to unlock quiz retries!",
            featureKey: "quiz_retry",
            upgradeUrl: "/pricing",
          },
        })
      );
      return;
    }

    if (!canRetry) return;

    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };

  const handleUpgradeClick = () => {
    window.dispatchEvent(
      new CustomEvent("subscription:premium-required", {
        detail: {
          message: "Quiz retries are exclusive to QuizGen Pro members (1 retry allowed per quiz). Upgrade to Pro to unlock quiz retries!",
          featureKey: "quiz_retry",
          upgradeUrl: "/pricing",
        },
      })
    );
  };

  return (
    <div className="space-y-3 mt-8 pt-6 border-t border-app">
      {!isPro ? (
        <div className="text-center text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/50 rounded-xl py-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Free Plan: 1 attempt allowed per quiz (0 retries). Upgrade to Pro for 1 retry per quiz!</span>
          <button
            type="button"
            onClick={handleUpgradeClick}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            Upgrade to Pro
          </button>
        </div>
      ) : !canRetry ? (
        <div className="text-center text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl py-2 px-4">
          Pro Limit Reached ({attemptCount} / {maxAttempts} attempts used). Retry limit reached for this quiz.
        </div>
      ) : null}

      <motion.div 
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Button 
          variant="secondary" 
          size="lg" 
          className="flex-1"
          onClick={onBackToLibrary}
        >
          <ArrowLeft size={18} className="mr-2" />
          {returnLabel}
        </Button>

        <Button 
          variant="outline" 
          size="lg" 
          className="flex-1"
          onClick={onReview}
        >
          <BookOpen size={18} className="mr-2" />
          Review Answers
        </Button>

        {!isPro ? (
          <Button 
            variant="secondary" 
            size="lg" 
            className="flex-1 opacity-70 hover:opacity-100 cursor-pointer border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold"
            onClick={handleUpgradeClick}
            title="Free Tier: No Retries Allowed. Upgrade to Pro!"
          >
            <Lock size={18} className="mr-2 text-amber-500" />
            Retry Quiz (Pro Only)
          </Button>
        ) : (
          <Button 
            variant="primary" 
            size="lg" 
            className="flex-1"
            onClick={handleRetry}
            disabled={isRetrying || !canRetry}
          >
            {isRetrying ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <RefreshCw size={18} className="mr-2" />
            )}
            {isRetrying ? "Starting..." : !canRetry ? "Retry Limit Reached" : "Retry Quiz"}
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default ResultActions;
