import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import authService from "../../services/authService";

import Logo from "../../components/ui/Logo";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import AuthHeader from "../../components/auth/AuthHeader";
import AuthDivider from "../../components/auth/AuthDivider";
import ThemeToggle from "../../components/auth/ThemeToggle";

const getErrorMessage = (err) => {
  const data = err.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (data.non_field_errors) return data.non_field_errors[0];
  
  const fieldErrors = Object.keys(data)
    .filter(key => !['message', 'detail', 'non_field_errors', 'error'].includes(key))
    .map(key => {
      const errorStr = Array.isArray(data[key]) ? data[key][0] : data[key];
      return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${errorStr}`;
    });
    
  if (fieldErrors.length > 0) return fieldErrors[0];
  
  return data.error || "An unexpected error occurred.";
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailError("");
    setApiError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccessMessage("OTP sent successfully! Redirecting...");
      
      // Delay navigation slightly so user can see success message
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1500);
      
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full"
    >
      <Card className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xl lg:p-10">
        {/* Theme Toggle */}
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        {/* Logo */}
        <Logo className="mb-8" />

        <AuthHeader
          title="Forgot Password?"
          subtitle="Enter your email address and we'll send you an OTP to reset your password."
        />

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {apiError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {apiError}
            </div>
          )}
          
          {successMessage && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-200">
              {successMessage}
            </div>
          )}

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
              setApiError("");
            }}
            leftIcon={Mail}
            error={emailError}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Sending OTP...
              </span>
            ) : (
              "Send OTP"
            )}
          </Button>
        </form>

        <div className="my-7">
          <AuthDivider />
        </div>

        <p className="text-center text-sm text-slate-500">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            Back to Login
          </Link>
        </p>
      </Card>
    </motion.div>
  );
};

export default ForgotPassword;