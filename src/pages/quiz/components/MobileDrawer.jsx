import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import QuestionPalette from "./QuestionPalette";

const MobileDrawer = ({
  isOpen,
  setIsOpen,
  totalQuestions,
  currentQuestionIndex,
  answers,
  markedForReview,
  onNavigate,
  reviewMode = false,
  questions = [],
}) => {
  return (
    <>
      {/* Drawer Toggle Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 pb-4 pt-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-slate-900 text-white rounded-2xl shadow-xl p-4 flex items-center justify-between font-medium active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm font-bold">{currentQuestionIndex + 1}</span>
            </div>
            <span>Question Palette</span>
          </div>
          {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 surface rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto lg:hidden"
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm pt-4 pb-2 flex justify-center border-b border-app z-10">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            
            <div className="p-6 pb-24">
              <QuestionPalette
                totalQuestions={totalQuestions}
                currentQuestionIndex={currentQuestionIndex}
                answers={answers}
                markedForReview={markedForReview}
                onNavigate={(idx) => {
                  onNavigate(idx);
                  setIsOpen(false); // Close on selection
                }}
                isLoading={false}
                reviewMode={reviewMode}
                questions={questions}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileDrawer;
