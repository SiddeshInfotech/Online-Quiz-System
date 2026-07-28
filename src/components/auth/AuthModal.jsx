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
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
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

          {/* Modal Container: 50 / 50 Split */}
          <motion.div
            className="relative w-full max-w-[950px] my-auto rounded-2xl md:rounded-3xl shadow-2xl surface border border-app/50 flex flex-col md:flex-row bg-[var(--bg-surface)] text-[var(--text-app)]"
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

            {/* Left Side: 50% Full-bleed Image with no text or extra overlays */}
            <div className="hidden md:block w-1/2 relative overflow-hidden bg-slate-950 min-h-[450px]">
              <img
                src={authImage}
                alt="Authentication"
                className="w-full h-full object-cover select-none"
              />
            </div>

            {/* Mobile Header (replaces left side image on small screens) */}
            <div className="md:hidden flex items-center gap-3 p-6 pb-0">
               <Logo isDarkBg={false} />
            </div>

            {/* Right Side: 50% Form */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="p-6 sm:p-8 md:p-10 flex flex-col">
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
