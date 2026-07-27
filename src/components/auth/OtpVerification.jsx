import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

import Button from "../../components/ui/Button";
import AuthHeader from "./AuthHeader";

import OTPInput from "./OTPInput";
import authService from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import { useAuthModal } from "../../context/AuthModalContext";

const OtpVerification = ({ email: propEmail, onBack, inModal = true }) => {
  const navigate = useNavigate();
  const { login, fetchProfile } = useAuth();
  const { changeView, meta, formData, clearSensitiveData } = useAuthModal() || {};

  const email = propEmail || meta?.email || formData?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setError("");
    setApiError("");
    setIsLoading(true);

    try {
      const response = await authService.verifyEmail(email, otp);
      
      // Wipe sensitive fields (password, confirmPassword) immediately post verification
      if (clearSensitiveData) {
        clearSensitiveData();
      }

      const token = response?.token || response?.access_token || response?.access || response?.data?.token || response?.data?.access_token || response?.data?.access;
      const refreshToken = response?.refresh || response?.refresh_token || response?.data?.refresh || response?.data?.refresh_token;

      if (token) {
        login(token, response?.user || null, refreshToken);

        if (!response?.user) {
          await fetchProfile();
        }

        if (changeView) {
          changeView("profile-completion");
        } else {
          navigate("/dashboard");
        }
      } else {
        // Fallback if backend does not return tokens on OTP verification
        if (changeView) {
          changeView("login", { message: "Email verified successfully! Please sign in." });
        } else {
          navigate("/login", {
            state: { message: "Email verified successfully! Please sign in." },
          });
        }
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.detail || err.response?.data?.error || err.response?.data?.otp?.[0];
      if (serverMsg && serverMsg.toLowerCase().includes("expire")) {
        setApiError("OTP expired. Please request a new code.");
      } else {
        setApiError(serverMsg || "Invalid OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    setApiError("");
    try {
      await authService.resendOTP(email, "Email Verification");
      setCountdown(60);
      setOtp("");
      setError("");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.detail;
      setApiError(errorMsg || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => {
    if (onBack) {
      onBack();
    } else if (changeView) {
      changeView("signup");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`w-full ${!inModal ? 'rounded-3xl border border-app surface p-8 shadow-xl lg:p-10 relative' : ''}`}
    >
      <div className="absolute right-5 top-5">

      </div>

      <AuthHeader
        title="Verify your email"
        subtitle={
          <>
            We've sent a 6-digit code to <br />
            <div className="mt-3 inline-flex items-center justify-center rounded-full surface-elev px-4 py-1.5 text-sm font-medium text-app border border-app shadow-sm">
              {email || "your email"}
            </div>
          </>
        }
      />

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {apiError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {apiError}
          </div>
        )}

        <div className="flex justify-center">
          <OTPInput value={otp} onChange={setOtp} error={error} />
        </div>

        <Button
          type="submit"
          variant="gradient"
          className="w-full"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              Verifying...
            </span>
          ) : (
            "Verify Email"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <p className="text-app-muted mb-2">Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className={`font-semibold transition-colors ${
            countdown > 0 || isResending
              ? "text-app-muted cursor-not-allowed"
              : "text-violet-600 hover:text-violet-700"
          }`}
        >
          {isResending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={14} /> Resending...
            </span>
          ) : countdown > 0 ? (
            `Resend OTP in ${countdown}s`
          ) : (
            "Resend OTP"
          )}
        </button>
      </div>

      <button
        onClick={handleBackToSignup}
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-2 text-sm font-medium text-app-muted hover:text-app-2 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to signup
      </button>
    </motion.div>
  );
};

export default OtpVerification;
