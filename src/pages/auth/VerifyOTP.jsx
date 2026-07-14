import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

import Logo from "../../components/ui/Logo";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

import AuthHeader from "../../components/auth/AuthHeader";
import ThemeToggle from "../../components/auth/ThemeToggle";
import OTPInput from "../../components/auth/OTPInput";
import authService from "../../services/authService";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

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
      await authService.verifyOTP(email, otp);
      navigate("/reset-password", { state: { email, otp } });
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Invalid OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setApiError("");
    setIsResending(true);
    try {
      await authService.resendOTP(email, "Password Reset");
      setCountdown(60);
      setOtp("");
      setError("");
    } catch (err) {
      setApiError(
        err.response?.data?.message || err.response?.data?.detail || "Failed to resend OTP. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null; // will redirect in useEffect

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full"
    >
      <Card className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xl lg:p-10">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <Logo className="mb-8" />

        <AuthHeader
          title="Verify OTP"
          subtitle={
            <>
              We've sent a 6-digit code to <br />
              <div className="mt-3 inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm">
                {email}
              </div>
            </>
          }
        />

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
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
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Verifying...
              </span>
            ) : (
              "Verify OTP"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-slate-500 mb-2 dark:text-slate-400">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className={`font-semibold transition-colors ${
              countdown > 0 || isResending
                ? "text-slate-400 cursor-not-allowed dark:text-slate-500"
                : "text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
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

        <Link
          to="/forgot-password"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          <ArrowLeft size={16} />
          Change Email
        </Link>
      </Card>
    </motion.div>
  );
};

export default VerifyOTP;
