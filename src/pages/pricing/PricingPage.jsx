import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Code2,
  BookOpen,
  PlusCircle,
  BarChart3,
  FileSpreadsheet,
  Headphones,
  Award,
} from "lucide-react";
import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import { AuthContext } from "../../context/AuthContext";

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

const PricingPage = () => {
  const { currentUser, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"
  const [selectedQuestionsPerDay, setSelectedQuestionsPerDay] = useState(25);
  const [currentPlan, setLocalPlan] = useState(() => getCurrentPlan(currentUser));
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const handlePlanChange = (e) => {
      if (e.detail?.plan) {
        setLocalPlan(e.detail.plan);
      }
    };
    window.addEventListener("app:refresh-plan", handlePlanChange);
    return () => window.removeEventListener("app:refresh-plan", handlePlanChange);
  }, []);

  const handleUpgrade = (targetPlan) => {
    if (targetPlan === currentPlan) return;
    setUpgrading(true);
    setTimeout(() => {
      setCurrentPlan(targetPlan, updateUser, currentUser);
      setLocalPlan(targetPlan);
      setUpgrading(false);
      if (targetPlan === "pro") {
        setShowSuccessModal(true);
      }
    }, 600);
  };

  const isPro = currentPlan === "pro";
  const questionOptions = [5, 10, 15, 20, 25];

  return (
    <div className="w-full max-w-6xl mx-auto pb-16 pt-4 px-4 sm:px-6">
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
          <span className={`text-sm font-semibold ${billingCycle === "monthly" ? "text-app" : "text-app-muted"}`}>
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-violet-600 transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full surface shadow ring-0 transition duration-200 ease-in-out ${
                billingCycle === "yearly" ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-app" : "text-app-muted"}`}>
            Annual Billing
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
              🔥 Save 20% • Most Popular
            </span>
          </span>
        </div>
      </motion.div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
        {/* FREE TIER CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex"
        >
          <Card
            className={`w-full p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
              !isPro
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-space-grotesk text-app">Free Tier</h3>
                  <p className="text-xs text-app-muted">For basic daily practice</p>
                </div>
              </div>

              <div className="my-6 pb-6 border-b border-app">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-space-grotesk text-app">$0</span>
                  <span className="text-sm font-medium text-app-muted">/ forever</span>
                </div>
                <p className="text-xs text-app-muted mt-1">No credit card required</p>
              </div>

              {/* Free Features List */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-app uppercase tracking-wider">Included Features:</p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-app">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Code2 size={13} />
                    </div>
                    <span>
                      <strong className="font-semibold text-app">5 / 10 coding questions per day</strong> only
                    </span>
                  </li>

                  <li className="flex items-start gap-3 text-sm text-app">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <RotateCcw size={13} />
                    </div>
                    <span>
                      <strong className="font-semibold text-app">1 retry allowed</strong> per quiz attempt
                    </span>
                  </li>

                  <li className="flex items-start gap-3 text-sm text-app">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen size={13} />
                    </div>
                    <span>
                      <strong className="font-semibold text-app">3 quizzes per day</strong> maximum limit
                    </span>
                  </li>

                  <li className="flex items-start gap-3 text-sm text-app-muted">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={13} />
                    </div>
                    <span>Basic AI question generation</span>
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
                  onClick={() => handleUpgrade("free")}
                  disabled={upgrading}
                >
                  Continue with Free
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
            className={`w-full p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border-2 ${
              isPro
                ? "border-violet-600 shadow-2xl ring-2 ring-violet-600/30"
                : "border-violet-500/80 shadow-xl hover:border-violet-600 hover:shadow-2xl"
            }`}
          >
            {/* Shiny Gradient Header */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400" />
            <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
              <Crown size={12} className="text-amber-300" />
              {isPro ? "Your Active Plan" : "MOST POPULAR"}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
                  <Crown size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-space-grotesk text-app flex items-center gap-2">
                    Premium Tier
                    <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                      👑 PRO
                    </span>
                  </h3>
                  <p className="text-xs text-app-muted">For serious coders & interview prep</p>
                </div>
              </div>

              <div className="my-6 pb-6 border-b border-app">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-space-grotesk text-app">
                    {billingCycle === "yearly" ? "$7.99" : "$9.99"}
                  </span>
                  <span className="text-sm font-medium text-app-muted">/ month</span>
                </div>
                <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mt-1">
                  {billingCycle === "yearly" ? "Billed annually ($95.88/yr)" : "Billed monthly"}
                </p>
              </div>

              {/* Exact Value Gain Highlights */}
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-amber-500/10 border border-violet-500/20">
                <p className="text-xs font-extrabold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  What You Gain with Pro:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-app">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <PlusCircle size={14} /> +7 Daily Quizzes
                  </span>
                  <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                    <PlusCircle size={14} /> +Unlimited AI
                  </span>
                  <span className="flex items-center gap-1 text-fuchsia-600 dark:text-fuchsia-400">
                    <PlusCircle size={14} /> +Detailed Reports
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <PlusCircle size={14} /> +Priority Support
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 col-span-2">
                    <PlusCircle size={14} /> +👑 PRO MEMBER Badge
                  </span>
                </div>
              </div>

              {/* Premium Specs Selector */}
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl surface-subtle border border-app">
                  <div className="flex items-center justify-between text-xs font-bold text-app mb-2">
                    <span className="flex items-center gap-1.5">
                      <Code2 size={15} className="text-violet-600 dark:text-violet-400" />
                      Selected Plan Limit:
                    </span>
                    <span className="text-violet-600 dark:text-violet-300 font-extrabold text-sm">
                      {selectedQuestionsPerDay} Qs / day
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {questionOptions.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedQuestionsPerDay(num)}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                          selectedQuestionsPerDay === num
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 scale-105"
                            : "surface text-app-muted hover:text-app border border-app"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <ul className="space-y-2.5 text-sm text-app">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-500 flex-shrink-0" />
                    <span><strong className="font-bold">2 Retries Allowed</strong> per quiz attempt</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-500 flex-shrink-0" />
                    <span><strong className="font-bold">10 Daily Quizzes</strong> capacity</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-app">
              {isPro ? (
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" className="w-full h-11 border-emerald-500/40 text-emerald-600 font-bold justify-center cursor-default" disabled>
                    <ShieldCheck size={18} className="mr-2 text-emerald-500" />
                    ✓ You're on Pro • Renews Aug 18, 2026
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-app-muted hover:text-app"
                    onClick={() => navigate("/profile")}
                  >
                    Manage Subscription →
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleUpgrade("pro")}
                  disabled={upgrading}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02]"
                >
                  {upgrading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Upgrading...
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Crown size={18} />
                      Upgrade to Pro Tier
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

      {/* 10-Row Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-12 max-w-4xl mx-auto"
      >
        <Card className="p-8">
          <h3 className="text-xl font-bold font-space-grotesk text-app mb-6 text-center">
            Complete Feature Comparison
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-app">
                  <th className="py-4 px-4 font-bold text-app">Features & Limits</th>
                  <th className="py-4 px-4 font-bold text-center text-app">Free Tier</th>
                  <th className="py-4 px-4 font-bold text-center text-violet-600 dark:text-violet-400">Premium Tier (PRO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <BookOpen size={16} className="text-violet-500" /> Daily Quizzes
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">3 Quizzes / day</td>
                  <td className="py-3.5 px-4 text-center font-bold text-violet-600 dark:text-violet-400 bg-violet-500/5">
                    10 Quizzes / day
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <Code2 size={16} className="text-violet-500" /> Coding Questions
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">5 / 10 max / day</td>
                  <td className="py-3.5 px-4 text-center font-bold text-violet-600 dark:text-violet-400 bg-violet-500/5">
                    Selected 5 - 25 Qs / day
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <RotateCcw size={16} className="text-violet-500" /> Quiz Retries
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">1 Retry per quiz</td>
                  <td className="py-3.5 px-4 text-center font-bold text-violet-600 dark:text-violet-400 bg-violet-500/5">
                    2 Retries per quiz
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <Sparkles size={16} className="text-violet-500" /> AI Quiz Generator
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">Standard Queue</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-violet-500/5">
                    Priority AI Engine
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <Zap size={16} className="text-violet-500" /> AI Explanation
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">Basic Summary</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-violet-500/5">
                    Unlimited Step-by-Step AI
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <BarChart3 size={16} className="text-violet-500" /> Detailed Reports
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">Basic Score</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-violet-500/5">
                    Comprehensive In-Depth Breakdown
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <BarChart3 size={16} className="text-violet-500" /> Performance Analytics
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">Recent History</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-violet-500/5">
                    Advanced Skill Trends
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-violet-500" /> Export History
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-violet-500/5">
                    PDF & CSV Export
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <Headphones size={16} className="text-violet-500" /> Priority Support
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">Standard Email</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-violet-500/5">
                    Priority Assistance
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-app flex items-center gap-2">
                    <Award size={16} className="text-violet-500" /> Premium Badge
                  </td>
                  <td className="py-3.5 px-4 text-center text-app-muted">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400 bg-violet-500/5">
                    👑 PRO MEMBER Badge
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSuccessModal(false)}
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
              <p className="text-sm text-app-muted mb-6 leading-relaxed">
                Unlimited AI unlocked. You now enjoy up to 25 coding questions per day, 2 retries per attempt, 10 daily quizzes, and priority AI assistance!
              </p>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/profile");
                }}
                className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold"
              >
                View Profile & Benefits
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PricingPage;
