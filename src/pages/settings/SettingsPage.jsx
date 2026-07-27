import { useState, useContext, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  LogOut,
  Trash2,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  Moon,
  Sun,
  Palette,
  Crown,
  Sparkles,
  CreditCard
} from "lucide-react";
import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import authService from "../../services/authService";
import { getCurrentPlan, setCurrentPlan } from "../pricing/PricingPage";
import subscriptionService from "../../services/subscriptionService";
import CancelSubscriptionModal from "../../components/common/CancelSubscriptionModal";

// ─────────────────────────────────────────────────────────────────────────────
// Delete Account Modal
// ─────────────────────────────────────────────────────────────────────────────

const DeleteAccountModal = ({ onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleConfirm = async () => {
    if (inputValue !== "DELETE") return;

    setIsDeleting(true);
    setErrorMsg("");
    try {
      // In a real app, import authService and call it
      // But we will pass the actual function in onConfirm for separation of concerns
      await onConfirm();
      setSuccessMsg("Account deleted successfully!");
      // The parent will handle redirect and logout after success
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isDeleting && !successMsg) onClose(); }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md surface rounded-3xl shadow-2xl border border-app p-8 z-10 text-center"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-600" size={32} />
        </div>

        <h2 className="text-2xl font-bold font-space-grotesk text-app mb-2">
          Delete Account?
        </h2>
        <p className="text-app-muted mb-6">
          Your account will be permanently deleted after 30 days. You can cancel this within 30 days by contacting support.
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-200">
            {successMsg}
          </div>
        )}

        {!successMsg && (
          <>
            <div className="mb-6 text-left">
              <label className="block text-sm font-medium text-app-2 mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-app focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all text-app"
                placeholder="DELETE"
                disabled={isDeleting}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="danger"
                className="w-full bg-red-600 hover:bg-red-700 text-white border-none h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleConfirm}
                disabled={isDeleting || inputValue !== "DELETE"}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
              </Button>
              <Button
                variant="secondary"
                className="w-full h-12"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Toggle Component
// ─────────────────────────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-violet-600' : 'surface-subtle border border-app'
      }`}
    onClick={onChange}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full surface shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
        }`}
    />
  </button>
);
// ─────────────────────────────────────────────────────────────────────────────
// Settings Page
// ─────────────────────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPlan, setCurrentPlanState] = useState(() => getCurrentPlan(currentUser));
  const [subData, setSubData] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadSub = async () => {
      try {
        setSubLoading(true);
        const data = await subscriptionService.getSubscription();
        if (isMounted && data) {
          setSubData(data);
          const activePlan = data.plan?.toLowerCase() || (data.is_pro ? "pro" : "free");
          setCurrentPlanState(activePlan);
        }
      } catch (err) {
        console.error("Settings subscription fetch error:", err);
      } finally {
        if (isMounted) setSubLoading(false);
      }
    };

    loadSub();

    const handlePlanChange = (e) => {
      if (e.detail?.plan) {
        setCurrentPlanState(e.detail.plan);
      }
      loadSub();
    };
    window.addEventListener("app:refresh-plan", handlePlanChange);
    return () => {
      isMounted = false;
      window.removeEventListener("app:refresh-plan", handlePlanChange);
    };
  }, []);

  const isPro = subData ? Boolean(subData.is_pro || subData.plan === "PRO") : currentPlan === "pro";

  const handleCancelSubConfirm = async () => {
    setCancellingSub(true);
    try {
      await subscriptionService.cancelSubscription();
      setCurrentPlan("free", null, currentUser);
      setCurrentPlanState("free");
      setSubData((prev) => ({ ...prev, plan: "FREE", is_pro: false, status: "CANCELLED" }));
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      setCurrentPlan("free", null, currentUser);
      setCurrentPlanState("free");
    } finally {
      setCancellingSub(false);
      setShowCancelModal(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteConfirm = async () => {
    await authService.deleteAccount();
    setTimeout(() => {
      logout();
      navigate("/login");
    }, 1500); // Wait so user sees the success message in the modal
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-space-grotesk text-app mb-2">
            Settings
          </h1>
          <p className="text-base text-app-muted">
            Customize your QuizGen AI experience
          </p>
        </motion.div>

        <div className="flex flex-col gap-6">

          {/* Product & Pricing Section */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.02 }}>
            <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300 border-violet-500/20">
              <div
                className="p-6 sm:p-8 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                onClick={() => navigate('/pricing', { state: { from: '/settings' } })}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    isPro
                      ? "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 shadow-violet-600/30"
                      : "bg-slate-700"
                  }`}>
                    <Crown size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider block mb-0.5">Current Plan</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        isPro
                          ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-amber-300 shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                      }`}>
                        {isPro ? "👑 PRO MEMBER" : "FREE TIER"}
                      </span>
                      <span className="text-sm font-semibold text-app">
                        {isPro ? "10 Daily Quizzes • 25 Coding Questions" : "3 Daily Quizzes • 10 Coding Questions"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                    Manage Subscription →
                  </span>
                </div>
              </div>
              {isPro && (
                <div className="px-6 py-3 surface-subtle border-t border-app flex items-center justify-between">
                  <span className="text-xs text-app-muted font-medium">
                    {subLoading
                      ? <span className="inline-block h-3 w-48 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
                      : `Pro Plan Active${subData?.renewal_date ? ` • Renews ${new Date(subData.renewal_date).toLocaleDateString()}` : ""}`
                    }
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCancelModal(true);
                    }}
                    disabled={cancellingSub}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                  >
                    {cancellingSub ? "Cancelling..." : "Cancel Subscription"}
                  </button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Appearance Section */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
            <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-app">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Palette className="text-violet-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-app">Appearance</h3>
                    <p className="text-sm text-app-muted">Customize the look and feel.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 rounded-xl surface-subtle border border-app">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon className="text-blue-500" size={20} /> : <Sun className="text-amber-500" size={20} />}
                      <div>
                        <p className="font-semibold text-app">Dark Mode</p>
                        <p className="text-sm text-app-muted">Easier on the eyes in low light environments.</p>
                      </div>
                    </div>
                    <Toggle checked={theme === 'dark'} onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Support Section */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
            <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div
                className="p-6 sm:p-8 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                onClick={() => navigate('/feedback')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-app">Support & Feedback</h3>
                    <p className="text-sm text-app-muted">Help us improve QuizGen AI.</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-app-muted" />
              </div>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
            <Card className="p-0 overflow-hidden border-red-500/20 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 sm:p-8 bg-red-500/5">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-500/20">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="text-red-600 dark:text-red-500" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-red-600 dark:text-red-500">Account Actions</h3>
                    <p className="text-sm text-red-600/80 dark:text-red-500/80">Manage your session and account data.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 h-12 surface border border-app text-app-2 hover:bg-[var(--bg-elevated)] transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    Logout
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 h-12 surface border border-red-500/20 text-red-600 dark:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 size={18} />
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteAccountModal
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteConfirm}
          />
        )}
      </AnimatePresence>

      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubConfirm}
        loading={cancellingSub}
        renewalDate={subData?.renewal_date ? new Date(subData.renewal_date).toLocaleDateString() : null}
      />
    </>
  );
};

export default SettingsPage;
