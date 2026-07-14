import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Key } from "lucide-react";
import authService from "../../services/authService";

import Logo from "../../components/ui/Logo";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/auth/PasswordInput";
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

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Only allow numeric input for OTP
    if (e.target.name === "otp") {
      value = value.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }));
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (!formData.otp.trim()) {
      newErrors.otp = "OTP is required.";
    } else if (formData.otp.length !== 6) {
      newErrors.otp = "OTP must be 6 digits.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      // 1. Verify OTP first
      setLoadingText("Verifying...");
      await authService.verifyOTP(formData.email, formData.otp);

      // 2. If OTP is verified, reset password
      setLoadingText("Resetting Password...");
      await authService.resetPassword(formData.email, formData.otp, formData.password);

      setSuccessMessage("Password reset successful! Redirecting to login...");
      
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);

    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setLoadingText("");
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
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <Logo className="mb-8" />

        <AuthHeader
          title="Create New Password"
          subtitle="Enter your OTP and choose a strong password."
        />

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
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
            value={formData.email}
            onChange={handleChange}
            leftIcon={Mail}
            error={errors.email}
          />

          <Input
            label="6-Digit OTP"
            name="otp"
            type="text"
            placeholder="123456"
            value={formData.otp}
            onChange={handleChange}
            leftIcon={Key}
            error={errors.otp}
            maxLength={6}
          />

          <PasswordInput
            label="New Password"
            name="password"
            placeholder="Enter your new password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm your new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                {loadingText}
              </span>
            ) : (
              "Reset Password"
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

export default ResetPassword;