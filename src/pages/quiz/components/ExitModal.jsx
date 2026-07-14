import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import Button from "../../../components/ui/Button";

const ExitModal = ({ isOpen, onClose, onConfirm, hasAnsweredAny }) => {
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
          onClick={onClose}
        />

        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="p-7 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-xl font-bold font-space-grotesk text-slate-900 mb-2">
              Exit Quiz?
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {hasAnsweredAny
                ? "Your progress has been automatically saved, but the quiz is not yet submitted. You can resume it later from your attempts dashboard."
                : "Are you sure you want to exit? You haven't answered any questions yet."}
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Continue Quiz
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                onClick={onConfirm}
              >
                Exit Anyway
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExitModal;
