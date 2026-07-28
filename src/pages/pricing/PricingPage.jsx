import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Code2,
  BookOpen,
  PlusCircle,
  BarChart3,
  FileSpreadsheet,
  Headphones,
  Award,
  AlertCircle,
} from "lucide-react";
import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import Navbar from "../../components/layout/Navbar";
import { AuthContext } from "../../context/AuthContext";
import subscriptionService from "../../services/subscriptionService";
import CancelSubscriptionModal from "../../components/common/CancelSubscriptionModal";

export const getCurrentPlan = (currentUser) => {
  if (currentUser?.plan) return currentUser.plan;
  if (currentUser?.tier) return currentUser.tier;
  return localStorage.getItem("quizgen_user_plan") || "free";
};

export const setCurrentPlan = (plan, updateUser, currentUser) => {
  localStorage.setItem("quizgen_user_plan", plan);
  if (updateUser && currentUser) {
    updateUser({ ...currentUser, plan, tier: plan });
  }
  window.dispatchEvent(new CustomEvent("app:refresh-plan", { detail: { plan } }));
};

const FAQ_ITEMS = [
  {
    q: "What happens if I cancel my subscription?",
    a: "Your Premium benefits remain active until the end of your current billing period. After it ends, your account automatically reverts to the Free plan with 3 daily quizzes, 5 or 10 question choices, and no retries.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes, absolutely. You can upgrade at any time from the Pricing page or your Profile settings. Your Pro benefits activate immediately upon upgrade.",
  },
  {
    q: "Do unused daily quizzes roll over to the next day?",
    a: "No, daily quiz limits reset every 24 hours and unused quizzes do not roll over. Each new day starts fresh with your full daily allocation.",
  },
  {
    q: "What payment methods are supported?",
    a: "Payment processing is coming soon. Currently upgrades are handled directly. Check back for updates on supported payment methods.",
  },
  {
    q: "When does my daily quota reset?",
    a: "Your daily quiz and coding question quotas reset at midnight (12:00 AM) UTC every day. The reset time is consistent regardless of your local timezone.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div className="flex flex-col gap-3">
      {FAQ_ITEMS.map((item, i) => (
        <div
          key={i}
          className={`surface border rounded-2xl overflow-hidden transition-all duration-200 ${openIndex === i ? "border-violet-500/40 shadow-md" : "border-app hover:border-violet-300 dark:hover:border-violet-700"}`}
        >
          <button
            type="button"
            className="w-full text-left flex items-center justify-between gap-3 px-5 py-4"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="text-sm font-bold text-app">{item.q}</span>
            <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 ${openIndex === i ? "bg-violet-600 border-violet-600 text-white rotate-45" : "border-app text-app-muted"}`}>
              <svg width="12" height="12" fill="none" viewBox="0 0 12 12"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="px-5 pb-4 text-sm text-app-muted leading-relaxed border-t border-app pt-3">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

const PricingPage = () => {
  const { currentUser, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine where the back button should go:
  // • If the caller passed state.from (e.g. Dashboard, Profile), go there.
  // • Otherwise fall back to browser history (-1) or the landing page.
  const backTarget = location.state?.from || null;
  const handleBack = () => {
    if (backTarget) {
      navigate(backTarget);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const [billingCycle, setBillingCycle] = useState("MONTHLY"); // "MONTHLY" | "YEARLY"
  const [selectedQuestionsPerDay, setSelectedQuestionsPerDay] = useState(25);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [plansData, setPlansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  // Load active subscription & plans from API
  useEffect(() => {
    let isMounted = true;
    const loadSubscriptionDetails = async () => {
      try {
        setLoading(true);
        const [subRes, plansRes] = await Promise.allSettled([
          subscriptionService.getSubscription(),
          subscriptionService.getPlans(),
        ]);

        if (isMounted) {
          if (subRes.status === "fulfilled" && subRes.value) {
            setSubscriptionData(subRes.value);
            const activePlan = subRes.value.plan?.toLowerCase() || (subRes.value.is_pro ? "pro" : "free");
            setCurrentPlan(activePlan, updateUser, currentUser);
          }

          if (plansRes.status === "fulfilled" && Array.isArray(plansRes.value)) {
            setPlansData(plansRes.value);
          }
        }
      } catch (err) {
        console.error("Failed to load subscription details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSubscriptionDetails();

    const handlePlanChange = () => {
      loadSubscriptionDetails();
    };
    window.addEventListener("app:refresh-plan", handlePlanChange);
    return () => {
      isMounted = false;
      window.removeEventListener("app:refresh-plan", handlePlanChange);
    };
  }, []);

  const isPro = Boolean(
    subscriptionData?.is_pro ||
    subscriptionData?.plan === "PRO" ||
    subscriptionData?.subscription_plan === "PRO" ||
    getCurrentPlan(currentUser) === "pro"
  );

  const handleUpgrade = async () => {
    if (isPro) return;
    setUpgrading(true);
    setApiError("");

    try {
      // Execute Razorpay order creation -> checkout popup -> payment verification flow
      const res = await subscriptionService.processRazorpayPayment(billingCycle, {
        name: currentUser?.full_name || currentUser?.username || "",
        email: currentUser?.email || "",
      });

      setCurrentPlan("pro", updateUser, currentUser);
      setSubscriptionData((prev) => ({
        ...prev,
        ...res,
        plan: "PRO",
        is_pro: true,
        status: "ACTIVE",
      }));
      setUpgradeSuccess(true);
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate("/profile");
      }, 2500);
    } catch (err) {
      console.error("Upgrade / Payment failed:", err);
      if (err.message && err.message.includes("cancelled")) {
        // User closed the popup — don't show red error banner
        setUpgrading(false);
        return;
      }
      setApiError(err.response?.data?.detail || err.message || "Payment verification failed. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!isPro) return;
    setCancelling(true);
    setApiError("");

    try {
      const res = await subscriptionService.cancelSubscription();
      setCurrentPlan("free", updateUser, currentUser);
      setSubscriptionData((prev) => ({
        ...prev,
        ...res,
        plan: "FREE",
        is_pro: false,
        status: "CANCELLED",
      }));
    } catch (err) {
      console.error("Cancel subscription failed:", err);
      setCurrentPlan("free", updateUser, currentUser);
      setSubscriptionData((prev) => ({
        ...prev,
        plan: "FREE",
        is_pro: false,
        status: "CANCELLED",
      }));
    } finally {
      setCancelling(false);
    }
  };

  const questionOptions = subscriptionData?.allowed_question_counts || [5, 10, 15, 20, 25];

  return (
    <>
      {!currentUser && <Navbar />}

      <div className="w-full max-w-6xl mx-auto pb-16 pt-6 px-4 sm:px-6">
        {/* Smart back button — returns to origin page */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl surface border border-app text-sm font-semibold text-app-muted hover:text-app hover:border-violet-500/50 shadow-sm transition-all duration-200"
          >
            <ArrowLeft size={16} />
            {backTarget ? `Back to ${backTarget === "/dashboard" ? "Dashboard" : backTarget === "/profile" ? "Profile" : "Previous Page"}` : "Back"}
          </button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wider mb-4 border border-violet-200 dark:border-violet-800">
            <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
            Transparent & Flexible Plans
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-space-grotesk text-app tracking-tight mb-4">
            Simple, Value-Packed Pricing
          </h1>
          <p className="text-lg text-app-muted leading-relaxed">
            Supercharge your coding skills and quiz preparation with QuizGen AI. Upgrade to Pro for maximum daily limits, extra retries, and AI assistance.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-semibold ${billingCycle === "MONTHLY" ? "text-app" : "text-app-muted"}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === "MONTHLY" ? "YEARLY" : "MONTHLY")}
              className="relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-violet-600 transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full surface shadow ring-0 transition duration-200 ease-in-out ${billingCycle === "YEARLY" ? "translate-x-7" : "translate-x-0"
                  }`}
              />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingCycle === "YEARLY" ? "text-app" : "text-app-muted"}`}>
              Annual Billing
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                🔥 Save 20% • Most Popular
              </span>
            </span>
          </div>
        </motion.div>

        {apiError && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={18} /> {apiError}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* FREE TIER CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex"
          >
            <Card
              className={`w-full p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${!isPro
                  ? "border-2 border-app shadow-lg"
                  : "border border-app hover:border-violet-300"
                }`}
            >
              {!isPro && (
                <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-app">
                  Active Plan
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-space-grotesk text-app">Free</h3>
                    <p className="text-xs text-app-muted">For basic practice</p>
                  </div>
                </div>

                <div className="my-6 pb-6 border-b border-app">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-space-grotesk text-app">₹0</span>
                    <span className="text-sm font-medium text-app-muted">/ forever</span>
                  </div>
                  <p className="text-xs text-app-muted mt-1">Free for everyone</p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-app uppercase tracking-wider mb-2">Features Included:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-sm text-app">
                      <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong className="font-semibold">AI Quiz Questions:</strong> Only 5 or 10</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-app">
                      <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong className="font-semibold">Quiz Generation / Day:</strong> Only 3 quizzes per day</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-app">
                      <span className="text-red-500 shrink-0 text-sm">❌</span>
                      <span><strong className="font-semibold">Retry / Re-attempt:</strong> No retry (1 attempt only)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-app">
                {!isPro ? (
                  <Button variant="secondary" className="w-full h-12 cursor-default font-bold opacity-80" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full h-12 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold"
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "Continue with Free"}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>

          {/* PREMIUM TIER CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex"
          >
            <Card
              className={`w-full p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border-2 ${isPro
                  ? "border-violet-600 shadow-2xl ring-2 ring-violet-600/30"
                  : "border-violet-500/80 shadow-xl hover:border-violet-600 hover:shadow-2xl"
                }`}
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400" />
              <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                <Crown size={12} className="text-amber-300" />
                {isPro ? "Active Plan" : "RECOMMENDED"}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
                    <Crown size={22} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-space-grotesk text-app flex items-center gap-2">
                      QuizGen Pro
                    </h3>
                    <p className="text-xs text-app-muted">For everyday mastery & interview prep</p>
                  </div>
                </div>

                <div className="my-6 pb-6 border-b border-app">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-space-grotesk text-app">
                      {billingCycle === "YEARLY" ? "₹249" : "₹299"}
                    </span>
                    <span className="text-sm font-medium text-app-muted">/ month</span>
                  </div>
                  <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mt-1">
                    {billingCycle === "YEARLY" ? "Billed annually (₹2,988/yr)" : "Billed monthly"}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-app uppercase tracking-wider mb-2">Everything in Free, plus:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-sm text-app font-semibold">
                      <Check size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                      <span><strong className="text-violet-600 dark:text-violet-400 font-extrabold">AI Quiz Questions:</strong> 5, 10, 15, 20, 25</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-app font-semibold">
                      <Check size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                      <span><strong className="text-violet-600 dark:text-violet-400 font-extrabold">Quiz Generation / Day:</strong> 10 quizzes per day</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-app font-semibold">
                      <Check size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                      <span><strong className="text-violet-600 dark:text-violet-400 font-extrabold">Quiz Attempts:</strong> Unlimited quiz attempts</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-app font-semibold">
                      <span className="text-emerald-500 shrink-0 text-sm">✅</span>
                      <span><strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">Retry / Re-attempt:</strong> 1 retry allowed (2 total attempts)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-app">
                {isPro ? (
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" className="w-full h-11 border-emerald-500/40 text-emerald-600 font-bold justify-center cursor-default" disabled>
                      <ShieldCheck size={18} className="mr-2 text-emerald-500" />
                      ✓ You're on Pro {subscriptionData?.renewal_date ? `• Renews ${new Date(subscriptionData.renewal_date).toLocaleDateString()}` : ""}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-red-500 hover:text-red-600"
                      onClick={() => setShowCancelModal(true)}
                      disabled={cancelling}
                    >
                      {cancelling ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02]"
                  >
                    {upgrading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Upgrading to Pro...
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Crown size={18} />
                        Upgrade to QuizGen Pro
                        <ArrowRight size={16} />
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Authentic Trust Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-12 max-w-3xl mx-auto text-center surface-subtle p-6 rounded-2xl border border-app shadow-sm"
        >
          <p className="text-sm sm:text-base font-medium text-app leading-relaxed">
            Upgrade to unlock the complete <strong className="text-violet-600 dark:text-violet-400 font-bold">QuizGen AI</strong> experience. Designed specifically for students preparing for coding interviews and technical assessments.
          </p>
        </motion.div>

        {/* 4-Row Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <Card className="p-8">
            <h3 className="text-xl font-bold font-space-grotesk text-app mb-6 text-center">
              Free vs Premium Tier – Final Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-app">
                    <th className="py-4 px-4 font-bold text-app">#</th>
                    <th className="py-4 px-4 font-bold text-app">Feature</th>
                    <th className="py-4 px-4 font-bold text-center text-app">Free Tier</th>
                    <th className="py-4 px-4 font-bold text-center text-violet-600 dark:text-violet-400">Premium Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-app-muted">1</td>
                    <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                      <Code2 size={16} className="text-violet-500" /> AI Quiz Questions
                    </td>
                    <td className="py-3.5 px-4 text-center text-app-muted">Only 5 or 10</td>
                    <td className="py-3.5 px-4 text-center font-bold text-violet-600 dark:text-violet-400 bg-violet-500/5">
                      5, 10, 15, 20, 25
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-app-muted">2</td>
                    <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                      <BookOpen size={16} className="text-violet-500" /> Quiz Generation / Day
                    </td>
                    <td className="py-3.5 px-4 text-center text-app-muted">Only 3 quizzes per day</td>
                    <td className="py-3.5 px-4 text-center font-bold text-violet-600 dark:text-violet-400 bg-violet-500/5">
                      10 quizzes per day
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-app-muted">3</td>
                    <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                      <Zap size={16} className="text-violet-500" /> Quiz Attempts
                    </td>
                    <td className="py-3.5 px-4 text-center text-app-muted">Limited daily practice</td>
                    <td className="py-3.5 px-4 text-center font-bold text-violet-600 dark:text-violet-400 bg-violet-500/5">
                      Unlimited quiz attempts
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-app-muted">4</td>
                    <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                      <RotateCcw size={16} className="text-violet-500" /> Retry / Re-attempt
                    </td>
                    <td className="py-3.5 px-4 text-center text-red-500 font-medium">❌ No retry (1 attempt only)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-violet-500/5">
                      ✅ 1 retry allowed (2 total attempts)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-bold font-space-grotesk text-app mb-6 text-center">
            Frequently Asked Questions
          </h3>
          <FAQ />
        </motion.div>

        {/* Cancel Subscription Modal */}
        <CancelSubscriptionModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={async () => {
            await handleCancelConfirm();
            setShowCancelModal(false);
          }}
          loading={cancelling}
          renewalDate={subscriptionData?.renewal_date ? new Date(subscriptionData.renewal_date).toLocaleDateString() : null}
        />

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md surface rounded-3xl p-8 shadow-2xl border border-app z-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-600/30">
                  <Crown size={32} />
                </div>
                <h2 className="text-2xl font-bold font-space-grotesk text-app mb-2">
                  🎉 Welcome to QuizGen Pro!
                </h2>
                <p className="text-sm text-app-muted mb-4 leading-relaxed">
                  Unlimited AI unlocked. You now enjoy up to 25 question choices per quiz, 1 retry per quiz (2 attempts), 10 daily quizzes, and priority AI assistance!
                </p>
                <p className="text-xs text-app-muted mb-6">Redirecting to your profile in a moment...</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default PricingPage;
