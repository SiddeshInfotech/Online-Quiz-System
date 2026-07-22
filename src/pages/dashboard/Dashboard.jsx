import { useDashboardContext } from "../../context/DashboardContext";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import ProfileCompletionCard from "../../components/dashboard/ProfileCompletionCard";
import StatsOverview from "../../components/dashboard/StatsOverview";
import QuizActivityCards from "../../components/dashboard/QuizActivityCards";
import RecentAttempts from "../../components/dashboard/RecentAttempts";
import PerformanceChart from "../../components/dashboard/PerformanceChart";
import RightSidebar from "../../components/dashboard/RightSidebar";

/**
 * Dashboard page
 *
 * All data is received from DashboardContext — no direct imports
 * of mock data. When the backend is connected, only
 * dashboardService.js needs to change; this file stays the same.
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

  // Derived: treat as new user when no quizzes completed yet.
  // Automatically updates once real API data is connected.
  const isNewUser = (user.completedQuizzes ?? 0) === 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Main Left Area (3 columns on extra large screens) */}
      <div className="xl:col-span-3 flex flex-col gap-6">

        {/* Profile Completion Reminder (Disappears automatically at 100%) */}
        {user?.profile_completion < 100 && (
          <ProfileCompletionCard user={user} />
        )}

        {/* Row 1: Welcome & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WelcomeBanner user={user} isNewUser={isNewUser} />
          </div>
          <div className="lg:col-span-1">
            <StatsOverview user={user} />
          </div>
        </div>

        {/* Row 2: Quiz Activity Cards */}
        <div>
          <QuizActivityCards
            lastQuiz={lastQuiz}
            availableQuizzesCount={availableQuizzesCount}
          />
        </div>

        {/* Row 3: Recent Attempts & Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentAttempts attempts={recentAttempts} />
          <PerformanceChart stats={performanceStats} chartData={chartData} />
        </div>

      </div>

      {/* Right Sidebar Area (1 column) */}
      <div className="xl:col-span-1">
        <RightSidebar notifications={notifications} />
      </div>
    </div>
  );
};

export default Dashboard;
