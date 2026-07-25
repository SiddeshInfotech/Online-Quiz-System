import { useDashboardContext } from "../../context/DashboardContext";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import ProfileCompletionCard from "../../components/dashboard/ProfileCompletionCard";
import { DailyStreakCard, OverallProgressCard } from "../../components/dashboard/StatsOverview";
import { TopNotificationsPanel } from "../../components/dashboard/RightSidebar";
import QuizActivityCards from "../../components/dashboard/QuizActivityCards";
import RecentAttempts from "../../components/dashboard/RecentAttempts";
import PerformanceChart from "../../components/dashboard/PerformanceChart";

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
