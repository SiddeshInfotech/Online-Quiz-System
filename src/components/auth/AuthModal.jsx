import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuthModal } from "../../context/AuthModalContext";
import Logo from "../ui/Logo";

import authImage from "../../assets/videos/authentication .png";

import Login from "../../pages/auth/Login";
import SignupForm from "./SignupForm";
import ForgotPassword from "../../pages/auth/ForgotPassword";
import ResetPassword from "../../pages/auth/ResetPassword";
import VerifyOTP from "../../pages/auth/VerifyOTP";
import OtpVerification from "./OtpVerification";
import ProfileCompletion from "./ProfileCompletion";
import TermsOfServicePage from "../../pages/legal/TermsOfServicePage";
import PrivacyPolicyPage from "../../pages/legal/PrivacyPolicyPage";

// Real legal components wrapped for modal view
const TermsOfServiceView = ({ onBack }) => (
  <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
    <button onClick={onBack} className="mb-4 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-2 cursor-pointer">
      &larr; Back to Signup
    </button>
    <TermsOfServicePage />
  </div>
);

const PrivacyPolicyView = ({ onBack }) => (
  <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
    <button onClick={onBack} className="mb-4 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-2 cursor-pointer">
      &larr; Back to Signup
    </button>
    <PrivacyPolicyPage />
  </div>
);

const AuthModal = () => {
  const { isOpen, view, closeModal, changeView } = useAuthModal();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderView = () => {
    switch (view) {
      case "login":
        return <Login inModal />;
      case "signup":
        return <SignupForm onSuccess={(email) => changeView("verify-email", { email })} inModal />;
      case "verify-email":
        return <OtpVerification onBack={() => changeView("signup")} inModal />;
      case "profile-completion":
        return <ProfileCompletion inModal />;
      case "forgot-password":
        return <ForgotPassword inModal />;
      case "reset-password":
        return <ResetPassword inModal />;
      case "verify-otp":
        return <VerifyOTP inModal />;
      case "tos":
        return <TermsOfServiceView onBack={() => changeView("signup")} />;
      case "privacy":
        return <PrivacyPolicyView onBack={() => changeView("signup")} />;
      default:
        return <Login inModal />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 w-screen h-screen min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Full Screen Background Image */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <img
              src={authImage}
              alt="Authentication Background"
              className="w-full h-full object-cover select-none"
            />
            {/* Dark Overlay with Backdrop Blur */}
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
          </div>

          {/* Close Button (Top-Right) */}
          <button
            onClick={closeModal}
            className="absolute top-5 right-5 z-30 p-2.5 rounded-full surface border border-app text-app-muted hover:text-app hover:border-violet-500/50 shadow-xl transition-all cursor-pointer"
            aria-label="Close authentication screen"
          >
            <X size={22} />
          </button>

          {/* Centered Form Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative z-20 w-full max-w-[620px] my-auto p-6 sm:p-8 md:p-9 surface border border-app/60 rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto text-[var(--text-app)]"
          >
            {renderView()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
