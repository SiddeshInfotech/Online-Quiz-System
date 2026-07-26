import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, X, ArrowRight, ShieldAlert, Check } from "lucide-react";
import Button from "../ui/Button/Button";

/**
 * PremiumUpgradeModal
 *
 * Global modal triggered by the `subscription:premium-required` event.
 *
 * Features:
 * - Feature-key-based dismissal memory: closing for feature A doesn't suppress feature B.
 * - "Why Upgrade?" panel showing key Pro benefits.
 * - Context-aware return: if user came from a feature action, returns to that page after close.
 */
const PRO_BENEFITS = [
  "10 Daily Quizzes",
  "25 Coding Questions",
  "Quiz Retry (2 Attempts)",
  "Advanced Analytics",
  "Priority Support",
  "👑 PRO MEMBER Badge",
];

const PremiumUpgradeModal = () => {
  const [modalState, setModalState] = useState(null); // { message, upgradeUrl, featureKey, returnPath }
  const navigate = useNavigate();

  // Track dismissed feature keys in this session — never a generic "dismissed all" flag
  const dismissedKeys = useRef(new Set());

  useEffect(() => {
    const handlePremiumRequired = (e) => {
      if (!e.detail) return;

      const featureKey = e.detail.featureKey || e.detail.upgradeUrl || "unknown";

      // If this exact feature was dismissed this session, skip re-triggering
      if (dismissedKeys.current.has(featureKey)) return;

      setModalState({
        message:
          e.detail.message ||
          "This feature is exclusive to QuizGen Pro. Upgrade to unlock the full experience!",
        upgradeUrl: e.detail.upgradeUrl || "/pricing",
        featureKey,
        returnPath: window.location.pathname,
      });
    };

    window.addEventListener("subscription:premium-required", handlePremiumRequired);
    return () => window.removeEventListener("subscription:premium-required", handlePremiumRequired);
  }, []);

  if (!modalState) return null;

  const handleDismiss = () => {
    // Remember dismissal for this specific feature key only
    dismissedKeys.current.add(modalState.featureKey);
    setModalState(null);
    // Return to the feature the user was trying to use
  };

  const handleUpgradeClick = () => {
    setModalState(null);
    navigate(modalState.upgradeUrl || "/pricing");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-md surface rounded-3xl shadow-2xl border-2 border-violet-500/40 z-10 overflow-hidden"
        >
          {/* Top Gradient Banner */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400" />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full text-app-muted hover:text-app hover:bg-[var(--bg-elevated)] transition-colors z-10"
          >
            <X size={18} />
          </button>

          <div className="p-8 text-center">
            {/* Crown Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-600/30">
              <Crown size={32} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold uppercase tracking-wider mb-3 border border-amber-500/20">
              <ShieldAlert size={13} />
              Pro Feature Locked
            </div>

            <h2 className="text-2xl font-bold font-space-grotesk text-app mb-2">
              Unlock QuizGen Pro
            </h2>

            <p className="text-sm text-app-muted leading-relaxed mb-5">
              {modalState.message}
            </p>

            {/* Why Upgrade? Panel */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/8 to-amber-500/8 border border-violet-500/20 text-left">
              <p className="text-xs font-extrabold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Why Upgrade?
              </p>
              <ul className="space-y-2">
                {PRO_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm font-semibold text-app">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleUpgradeClick}
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={18} />
                  Upgrade to Pro Now
                  <ArrowRight size={16} />
                </span>
              </Button>

              <Button
                variant="secondary"
                className="w-full h-11 text-xs"
                onClick={handleDismiss}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PremiumUpgradeModal;
