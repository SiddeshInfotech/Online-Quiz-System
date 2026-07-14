import React from "react";
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
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSubmitting ? onClose : undefined}
        />

        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
          <div className="p-7">
            {!isSubmitting && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold font-space-grotesk text-slate-900 mb-2">
                Submit Quiz?
              </h2>
              <p className="text-sm text-slate-500">
                Are you sure you want to submit? You won't be able to change your answers after this.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs font-semibold uppercase">Answered</span>
                </div>
                <span className="text-xl font-bold text-slate-800">{stats.answered}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <HelpCircle size={14} className="text-slate-400" />
                  <span className="text-xs font-semibold uppercase">Unanswered</span>
                </div>
                <span className="text-xl font-bold text-slate-800">{stats.unanswered}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100 col-span-2">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Bookmark size={14} className="text-amber-500" />
                  <span className="text-xs font-semibold uppercase">Marked for Review</span>
                </div>
                <span className="text-xl font-bold text-slate-800">{stats.marked}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Unanswered warning */}
            {stats.unanswered > 0 && !error && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  You still have {stats.unanswered} unanswered questions.
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
