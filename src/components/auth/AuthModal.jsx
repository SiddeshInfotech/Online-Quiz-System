import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useAuthModal } from "../../context/AuthModalContext";
import DashboardPreview from "../Landing/Hero/DashboardPreview";
import Logo from "../ui/Logo";

// View components to be refactored to work inside the modal
import Login from "../../pages/auth/Login";
import SignupForm from "./SignupForm";
import ForgotPassword from "../../pages/auth/ForgotPassword";
import ResetPassword from "../../pages/auth/ResetPassword";
import VerifyOTP from "../../pages/auth/VerifyOTP";

// Placeholder components for TOS and Privacy
const TermsOfService = ({ onBack }) => (
  <div className="p-8">
    <button onClick={onBack} className="mb-4 text-violet-600 font-medium hover:underline flex items-center gap-2">
      &larr; Back to Signup
    </button>
    <h2 className="text-2xl font-bold mb-4 text-app">Terms of Service</h2>
    <div className="prose prose-sm text-app-2 max-h-[60vh] overflow-y-auto pr-2">
      <p>Welcome to QuizGen AI. By using our service, you agree to the following terms...</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    </div>
  </div>
);

const PrivacyPolicy = ({ onBack }) => (
  <div className="p-8">
    <button onClick={onBack} className="mb-4 text-violet-600 font-medium hover:underline flex items-center gap-2">
      &larr; Back to Signup
    </button>
    <h2 className="text-2xl font-bold mb-4 text-app">Privacy Policy</h2>
    <div className="prose prose-sm text-app-2 max-h-[60vh] overflow-y-auto pr-2">
      <p>Your privacy is important to us. This policy explains how we collect, use, and protect your data.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    </div>
  </div>
);



const AuthModal = () => {
  const { isOpen, view, closeModal, changeView } = useAuthModal();

  if (!isOpen) return null;

  const renderView = () => {
    switch (view) {
      case "login":
        return <Login inModal />;
      case "signup":
        return <SignupForm onSuccess={() => changeView("login")} inModal />;
      case "forgot-password":
        return <ForgotPassword inModal />;
      case "reset-password":
        return <ResetPassword inModal />;
      case "verify-otp":
        return <VerifyOTP inModal />;
      case "tos":
        return <TermsOfService onBack={() => changeView("signup")} />;
      case "privacy":
        return <PrivacyPolicy onBack={() => changeView("signup")} />;
      default:
        return <Login inModal />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-[1000px] max-h-[95vh] overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl surface border border-app/50 flex flex-col md:flex-row bg-[var(--bg-surface)] text-[var(--text-app)]"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 p-2 rounded-full surface-elev text-app-muted hover:text-app hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <X size={20} />
            </button>

            {/* Left Side: Illustration / Branding */}
            <div className="hidden md:flex flex-col justify-between w-5/12 bg-gradient-to-br from-violet-600 to-indigo-900 p-10 text-white relative overflow-hidden">
              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-violet-400/20 blur-3xl"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div>
                  <Logo className="mb-10" isDarkBg={true} />
                
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-space-grotesk leading-tight">
                  Master any topic with AI quizzes.
                </h2>
                <p className="text-violet-200 text-sm lg:text-base">
                  Join thousands of learners generating personalized assessments in seconds.
                </p>

                </div>

                {/* Dashboard Mockup Injection */}
                <div className="mt-8 relative -mx-4 lg:-mx-2 transform scale-[0.85] origin-top opacity-90 hover:opacity-100 transition-opacity">
                   <DashboardPreview />
                </div>
              </div>
            </div>

            {/* Mobile Header (replaces left side on small screens) */}
            <div className="md:hidden flex items-center gap-3 p-6 pb-0">
               <Logo isDarkBg={false} />
            </div>

            {/* Right Side: Form */}
            <div className="w-full md:w-7/12 flex-1 overflow-y-auto no-scrollbar">
              <div className="p-6 sm:p-8 md:p-10 min-h-full flex flex-col justify-center">
                {renderView()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
