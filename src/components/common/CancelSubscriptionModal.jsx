import { motion, AnimatePresence } from "framer-motion";
import { Crown, ShieldOff, X } from "lucide-react";
import Button from "../ui/Button/Button";

/**
 * CancelSubscriptionModal
 *
 * Enhanced confirmation dialog before cancelling a Pro subscription.
 * Clearly explains that benefits remain active until billing period ends.
 *
 * Props:
 *   isOpen      — boolean, controls visibility
 *   onClose     — callback to dismiss
 *   onConfirm   — callback to confirm cancellation (async)
 *   loading     — boolean, shows spinner on confirm button
 *   renewalDate — string, e.g. "Aug 26, 2026" (optional)
 */
const CancelSubscriptionModal = ({ isOpen, onClose, onConfirm, loading = false, renewalDate }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md surface rounded-3xl p-8 shadow-2xl border border-red-200 dark:border-red-800/50 z-10 text-center overflow-hidden"
        >
          {/* Top accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-500" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-app-muted hover:text-app hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-5 border border-red-200 dark:border-red-800">
            <ShieldOff size={30} />
          </div>

          <h2 className="text-xl font-bold font-space-grotesk text-app mb-3">
            Cancel Subscription?
          </h2>

          <p className="text-sm text-app-muted leading-relaxed mb-2">
            Your Premium benefits will remain active until the end of your current billing period.
            After that, your account will automatically return to the Free plan.
          </p>

          {renewalDate && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-500/20 mb-5">
              <Crown size={13} />
              Pro access until {renewalDate}
            </div>
          )}

          {!renewalDate && <div className="mb-5" />}

          <div className="flex flex-col gap-3 mt-2">
            <Button
              onClick={onClose}
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-md"
            >
              Keep Subscription
            </Button>

            <Button
              variant="secondary"
              onClick={onConfirm}
              disabled={loading}
              className="w-full h-11 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  Cancelling...
                </span>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CancelSubscriptionModal;
