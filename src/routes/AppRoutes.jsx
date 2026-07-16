import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";

import AuthLayout from "../layouts/AuthLayout";
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

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Authentication */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
      </Route>

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
