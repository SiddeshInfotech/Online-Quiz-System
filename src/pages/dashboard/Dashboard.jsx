import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Crown, Book, Code2, ArrowRight } from "lucide-react";
import { useDashboardContext } from "../../context/DashboardContext";
import { AuthContext } from "../../context/AuthContext";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import ProfileCompletionCard from "../../components/dashboard/ProfileCompletionCard";
import { DailyStreakCard, OverallProgressCard } from "../../components/dashboard/StatsOverview";
import { TopNotificationsPanel } from "../../components/dashboard/RightSidebar";
import QuizActivityCards from "../../components/dashboard/QuizActivityCards";
import RecentAttempts from "../../components/dashboard/RecentAttempts";
import PerformanceChart from "../../components/dashboard/PerformanceChart";
import Card from "../../components/ui/Card/Card";
import subscriptionService from "../../services/subscriptionService";
import RenewalBanner from "../../components/common/RenewalBanner";
import { getCurrentPlan } from "../pricing/PricingPage";

const SubscriptionWidget = () => {
  const { currentUser } = useContext(AuthContext);
  const [currentPlan, setCurrentPlanState] = useState(() => getCurrentPlan(currentUser));
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadSub = async () => {
      try {
        setLoading(true);
        const data = await subscriptionService.getSubscription();
        if (isMounted && data) {
          setSubData(data);
          const activePlan = data.plan?.toLowerCase() || (data.is_pro ? "pro" : "free");
          setCurrentPlanState(activePlan);
        }
      } catch (err) {
        console.error("Dashboard subscription fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
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

  // Only use real API values — no hardcoded fallbacks
  const quizUsed = subData?.daily_quiz_used;
  const quizTotal = subData?.daily_quiz_limit;
  const quizRemaining = subData?.daily_quiz_remaining ?? (quizTotal != null && quizUsed != null ? Math.max(0, quizTotal - quizUsed) : null);
  const quizPct = quizUsed != null && quizTotal ? Math.min(100, Math.round((quizUsed / quizTotal) * 100)) : 0;

  const codeUsed = subData?.coding_question_used;
  const codeTotal = subData?.coding_question_limit;
  const codeRemaining = codeTotal != null && codeUsed != null ? Math.max(0, codeTotal - codeUsed) : null;
  const codePct = codeUsed != null && codeTotal ? Math.min(100, Math.round((codeUsed / codeTotal) * 100)) : 0;

  const renewalDateStr = subData?.renewal_date
    ? new Date(subData.renewal_date).toLocaleDateString()
    : null;

  // Skeleton pulse class
  const sk = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";

  return (
    <Card className={`p-5 sm:p-6 relative overflow-hidden transition-all duration-300 border-2 shadow-sm hover:shadow-md ${
      isPro
        ? "border-violet-500/40 surface shadow-violet-500/5"
        : "border-app surface"
    }`}>
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -right-12 -top-12 w-44 h-44 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        {/* Left Info */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
            loading ? "bg-slate-200 dark:bg-slate-700" :
            isPro
              ? "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 shadow-violet-600/30"
              : "bg-slate-700 dark:bg-slate-800"
          }`}>
            {!loading && <Crown size={22} className={isPro ? "animate-pulse" : ""} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {loading ? (
                <div className={`h-4 w-24 ${sk}`} />
              ) : (
                <>
                  <h3 className="text-base font-bold font-space-grotesk text-app">Subscription</h3>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    isPro
                      ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-amber-300 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                  }`}>
                    {isPro ? "👑 PRO MEMBER" : "Free Tier"}
                  </span>
                </>
              )}
            </div>
            {loading ? (
              <div className={`h-3 w-36 mt-1.5 ${sk}`} />
            ) : (
              <p className="text-xs text-app-muted mt-0.5 font-medium">
                Next Renewal: <strong className="text-app font-bold">{renewalDateStr ?? "—"}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Middle Usage Progress Bar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 py-2.5 px-5 rounded-2xl surface-subtle border border-app flex-1 max-w-xl">
          {/* Daily Quizzes */}
          <div className="flex-1 w-full flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-app-muted text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Book size={14} className="text-violet-600 dark:text-violet-400" /> Daily Quizzes
              </span>
              {loading ? (
                <div className={`h-3 w-20 ${sk}`} />
              ) : (
                <span className="font-extrabold text-app font-space-grotesk text-xs">
                  {quizUsed ?? "—"} / {quizTotal ?? "—"}
                  {quizRemaining != null && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">({quizRemaining} left)</span>
                  )}
                </span>
              )}
            </div>
            <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden p-0.5 border border-app/50">
              {loading ? (
                <div className={`h-full w-3/5 ${sk} rounded-full`} />
              ) : (
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-700"
                  style={{ width: `${quizPct}%` }}
                />
              )}
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-app" />

          {/* Coding Questions */}
          <div className="flex-1 w-full flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-app-muted text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Code2 size={14} className="text-violet-600 dark:text-violet-400" /> Coding Questions
              </span>
              {loading ? (
                <div className={`h-3 w-20 ${sk}`} />
              ) : (
                <span className="font-extrabold text-app font-space-grotesk text-xs">
                  {codeUsed ?? "—"} / {codeTotal ?? "—"}
                  {codeRemaining != null && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">({codeRemaining} left)</span>
                  )}
                </span>
              )}
            </div>
            <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden p-0.5 border border-app/50">
              {loading ? (
                <div className={`h-full w-4/5 ${sk} rounded-full`} />
              ) : (
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${codePct}%` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Action */}
        <Link
          to="/pricing"
          className="group text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors flex items-center gap-1.5 shrink-0 self-end lg:self-center bg-violet-500/10 hover:bg-violet-500/20 px-3.5 py-2 rounded-xl border border-violet-500/20"
        >
          Manage Subscription
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Card>
  );
};

/** Tiny component: fetches subscription data and renders the renewal banner */
const DashboardRenewalBanner = () => {
  const [daysRemaining, setDaysRemaining] = useState(null);

  useEffect(() => {
    let isMounted = true;
    subscriptionService.getSubscription().then((data) => {
      if (isMounted && data?.is_pro) {
        setDaysRemaining(data.days_remaining ?? null);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return <RenewalBanner daysRemaining={daysRemaining} />;
};

/**
 * Student Dashboard page
 *
 * Top Section layout:
 * - Desktop: 4 cards in 1 row (Welcome 28%, Daily Streak 22%, Overall Progress 24%, Notifications 26%)
 * - Tablet: Welcome top, Daily Streak & Overall Progress side-by-side, Notifications below
 * - Mobile: Stacked vertically
 */
const Dashboard = () => {
  const { data } = useDashboardContext();

  const {
    user,
    lastQuiz,
    availableQuizzesCount,
    recentAttempts,
    performanceStats,
    chartData,
    notifications,
  } = data;

  const isNewUser = (user.completedQuizzes ?? 0) === 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-inter">
      {/* Profile Completion Reminder (Disappears automatically at 100%) */}
      {user?.profile_completion < 100 && (
        <ProfileCompletionCard user={user} />
      )}

      {/* Row 1: Top Dashboard Metrics & Notifications Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        {/* Welcome Card: ~28% width on desktop */}
        <div className="md:col-span-2 lg:col-span-3 h-full">
          <WelcomeBanner user={user} isNewUser={isNewUser} />
        </div>

        {/* Daily Streak Card: ~22% width on desktop */}
        <div className="md:col-span-1 lg:col-span-3 h-full">
          <DailyStreakCard user={user} />
        </div>

        {/* Overall Progress Card: ~24% width on desktop */}
        <div className="md:col-span-1 lg:col-span-3 h-full">
          <OverallProgressCard user={user} />
        </div>

        {/* Top Notifications Panel: ~26% width on desktop */}
        <div className="md:col-span-2 lg:col-span-3 h-full">
          <TopNotificationsPanel notifications={notifications} />
        </div>
      </div>

      {/* Renewal Banner (visible only for Pro users nearing expiry) */}
      <DashboardRenewalBanner />

      {/* Subscription & Today's Usage Widget */}
      <SubscriptionWidget />

      {/* Row 2: Full-width Performance Overview Chart */}
      <div className="w-full">
        <PerformanceChart stats={performanceStats} chartData={chartData} />
      </div>

      {/* Row 3: Recent Quiz Attempts & Continue Last Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentAttempts attempts={recentAttempts} />
        <QuizActivityCards
          lastQuiz={lastQuiz}
          availableQuizzesCount={availableQuizzesCount}
        />
      </div>
    </div>
  );
};

export default Dashboard;
