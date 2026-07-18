import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Trophy } from "lucide-react";
import Button from "../ui/Button/Button";

const ClaimModal = ({ isOpen, badge, onClose }) => {
  if (!isOpen || !badge) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative bg-white w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl overflow-hidden"
        >
          {/* Confetti / Glow background effect */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-violet-500/20 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/20 blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-6 text-violet-600 shadow-inner">
              <Trophy size={32} />
            </div>

            <h2 className="text-2xl font-bold font-space-grotesk text-slate-800 mb-2">
              Congratulations!
            </h2>
            <p className="text-sm text-slate-500 mb-8">
              You've successfully claimed the <span className="font-bold text-violet-600">{badge.name}</span> badge.
            </p>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-32 h-32 mb-6"
            >
              {badge.image_url ? (
                <img
                  src={badge.image_url}
                  alt={badge.name}
                  className="w-full h-full object-contain filter drop-shadow-xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${badge.name}&backgroundColor=6D5EF9`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-slate-200 rounded-full" />
              )}
            </motion.div>

            <div className="inline-flex flex-col items-center mb-8">
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full font-bold text-lg border border-amber-200 shadow-sm">
                <Sparkles size={20} />
                +{badge.xp_earned || badge.xp_reward} XP
              </div>
              {badge.new_total_xp !== undefined && (
                <p className="text-sm font-medium text-amber-700 mt-2">
                  New Total: {badge.new_total_xp} XP
                </p>
              )}
            </div>

            <Button onClick={onClose} className="w-full justify-center py-3">
              Continue
            </Button>
            <p className="text-xs text-slate-400 mt-4">
              Keep learning to unlock more achievements.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ClaimModal;
