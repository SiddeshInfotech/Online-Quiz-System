import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, BookOpen, ArrowLeft } from "lucide-react";
import Button from "../../../../components/ui/Button";

const ResultActions = ({ onRetry, onReview, onBackToLibrary, isLoading }) => {
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
    <motion.div 
      className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-app"
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
        Back to Library
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
    </motion.div>
  );
};

export default ResultActions;
