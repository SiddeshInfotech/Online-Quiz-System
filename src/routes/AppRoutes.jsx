import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";

import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOTP from "../pages/auth/VerifyOTP";
import ResetPassword from "../pages/auth/ResetPassword";
import PasswordResetSuccess from "../pages/auth/PasswordResetSuccess";

import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import LibraryPage from "../pages/library/LibraryPage";
import ProfilePage from "../pages/profile/ProfilePage";
import SettingsPage from "../pages/settings/SettingsPage";
import FeedbackPage from "../pages/feedback/FeedbackPage";

import QuizManagement from "../pages/dashboard/QuizManagement";
import MyAttempts from "../pages/dashboard/MyAttempts";
import LeaderboardPage from "../pages/leaderboard/LeaderboardPage";
import GenerateQuizPage from "../pages/generate/GenerateQuizPage";
import QuizDetailsPage from "../pages/quiz/QuizDetailsPage";
import QuizAttemptPage from "../pages/quiz/QuizAttemptPage";
import QuizResultsPage from "../pages/quiz/QuizResultsPage";
import QuizReviewPage from "../pages/quiz/QuizReviewPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";

import AchievementPage from "../pages/Achievements/AchievementPage";
import BadgeDetailsPage from "../pages/Achievements/BadgeDetailsPage";
import UserBadgesPage from "../pages/Achievements/UserBadgesPage";

import TermsOfServicePage from "../pages/legal/TermsOfServicePage";
import PrivacyPolicyPage from "../pages/legal/PrivacyPolicyPage";
import ContactPage from "../pages/contact/ContactPage";

const AppRoutes = () => {
  return (
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
  );
};

export default AppRoutes;
