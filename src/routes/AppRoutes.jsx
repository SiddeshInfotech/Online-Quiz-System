import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// Lazy-loaded pages for bundle optimization
const TermsOfServicePage = lazy(() => import("../pages/legal/TermsOfServicePage"));
const PrivacyPolicyPage = lazy(() => import("../pages/legal/PrivacyPolicyPage"));
const ContactPage = lazy(() => import("../pages/contact/ContactPage"));

const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const LibraryPage = lazy(() => import("../pages/library/LibraryPage"));
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const SettingsPage = lazy(() => import("../pages/settings/SettingsPage"));
const FeedbackPage = lazy(() => import("../pages/feedback/FeedbackPage"));
const QuizManagement = lazy(() => import("../pages/dashboard/QuizManagement"));
const MyAttempts = lazy(() => import("../pages/dashboard/MyAttempts"));
const LeaderboardPage = lazy(() => import("../pages/leaderboard/LeaderboardPage"));
const GenerateQuizPage = lazy(() => import("../pages/generate/GenerateQuizPage"));
const QuizDetailsPage = lazy(() => import("../pages/quiz/QuizDetailsPage"));
const QuizAttemptPage = lazy(() => import("../pages/quiz/QuizAttemptPage"));
const QuizResultsPage = lazy(() => import("../pages/quiz/QuizResultsPage"));
const QuizReviewPage = lazy(() => import("../pages/quiz/QuizReviewPage"));

const AchievementPage = lazy(() => import("../pages/Achievements/AchievementPage"));
const BadgeDetailsPage = lazy(() => import("../pages/Achievements/BadgeDetailsPage"));
const UserBadgesPage = lazy(() => import("../pages/Achievements/UserBadgesPage"));

const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-8">
    <div className="w-9 h-9 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Authentication Routes (Now open Modal over Landing Page) */}
        <Route path="/login" element={<LandingPage />} />
        <Route path="/signup" element={<LandingPage />} />
        <Route path="/forgot-password" element={<LandingPage />} />
        <Route path="/verify-otp" element={<LandingPage />} />
        <Route path="/reset-password" element={<LandingPage />} />
        <Route path="/password-reset-success" element={<LandingPage />} />

        {/* Dashboard (Protected Routes) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/attempts" element={<MyAttempts />} />
            <Route path="/quiz-management" element={<QuizManagement />} />
            <Route path="/generate" element={<GenerateQuizPage />} />
            <Route path="/quiz/:id" element={<QuizDetailsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/achievements" element={<AchievementPage />} />
            <Route path="/badges/:id" element={<BadgeDetailsPage />} />
            <Route path="/profile/badges" element={<UserBadgesPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Route>
          
          {/* Full-screen protected routes (no sidebar) */}
          <Route path="/attempts/:attemptId" element={<QuizAttemptPage />} />
          <Route path="/results/:attemptId" element={<QuizResultsPage />} />
          <Route path="/results/:attemptId/review" element={<QuizReviewPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
