import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2, Bookmark, HelpCircle } from "lucide-react";
import Button from "../../../components/ui/Button";

const SubmitModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  stats,
  error,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSubmitting ? onClose : undefined}
        />

        <motion.div
          className="relative surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
          <div className="p-7">
            {!isSubmitting && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-app-muted hover:text-app-2 transition-colors p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold font-space-grotesk text-app mb-2">
                Submit Quiz?
              </h2>
              <p className="text-sm text-app-muted">
                Are you sure you want to submit? You won't be able to change your answers after this.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="surface-subtle rounded-xl p-3 flex flex-col items-center justify-center border border-app">
                <div className="flex items-center gap-1.5 text-app-muted mb-1">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs font-semibold uppercase">Answered</span>
                </div>
                <span className="text-xl font-bold text-app">{stats.answered}</span>
              </div>
              <div className="surface-subtle rounded-xl p-3 flex flex-col items-center justify-center border border-app">
                <div className="flex items-center gap-1.5 text-app-muted mb-1">
                  <HelpCircle size={14} className="text-app-muted" />
                  <span className="text-xs font-semibold uppercase">Unanswered</span>
                </div>
                <span className="text-xl font-bold text-app">{stats.unanswered}</span>
              </div>
              <div className="surface-subtle rounded-xl p-3 flex flex-col items-center justify-center border border-app col-span-2">
                <div className="flex items-center gap-1.5 text-app-muted mb-1">
                  <Bookmark size={14} className="text-amber-500" />
                  <span className="text-xs font-semibold uppercase">Marked for Review</span>
                </div>
                <span className="text-xl font-bold text-app">{stats.marked}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Unanswered warning */}
            {stats.unanswered > 0 && !error && (
              <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  You still have {stats.unanswered} unanswered question{stats.unanswered > 1 ? "s" : ""}. Unanswered questions will automatically be treated as unanswered/incorrect during scoring.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Continue Quiz
              </Button>
              <Button
                variant="primary"
                className="flex-1 relative"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Anyway"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubmitModal;
