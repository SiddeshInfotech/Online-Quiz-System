import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, BookOpen, ArrowLeft } from "lucide-react";
import Button from "../../../../components/ui/Button";

const ResultActions = ({
  canRetry = true,
  attemptCount = null,
  maxAttempts = null,
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
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };

  return (
    <div className="space-y-3 mt-8 pt-6 border-t border-app">
      {!canRetry && maxAttempts !== null && (
        <div className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl py-2 px-4">
          Maximum attempts reached ({attemptCount ?? maxAttempts} / {maxAttempts} attempts used). Retry is unavailable.
        </div>
      )}
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

        {canRetry && (
          <Button 
            variant="primary" 
            size="lg" 
            className="flex-1"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <RefreshCw size={18} className="mr-2" />
            )}
            {isRetrying ? "Starting..." : "Retry Quiz"}
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default ResultActions;
