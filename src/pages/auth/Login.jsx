import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import authService from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

import Logo from "../../components/ui/Logo";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import AuthHeader from "../../components/auth/AuthHeader";
import PasswordInput from "../../components/auth/PasswordInput";
import SocialButton from "../../components/auth/SocialButton";
import AuthDivider from "../../components/auth/AuthDivider";


const getErrorMessage = (err) => {
  const status = err.response?.status;
  const data = err.response?.data;

  // Explicit 403 handling for unverified users
  if (status === 403) {
    if (data?.deactivated_at || (typeof data?.detail === 'string' && data.detail.toLowerCase().includes('deactivated'))) {
      const date = data.deactivated_at ? data.deactivated_at.split('T')[0] : 'YYYY-MM-DD';
      // If the backend provides the full string, use it, otherwise use the template
      const msg = typeof data?.detail === 'string' && data.detail.includes('YYYY-MM-DD') === false 
        ? data.detail 
        : `Your account was deactivated on ${date}. Please contact support.`;
      return msg;
    }
    return "Please verify your email before logging in.";
  }

  if (!data) return "Something went wrong. Please try again.";
  
  const rawMessage = JSON.stringify(data).toLowerCase();
  
  if (data.deactivated_at || rawMessage.includes("deactivated")) {
     const date = data.deactivated_at ? data.deactivated_at.split('T')[0] : 'YYYY-MM-DD';
     const msg = data.detail?.includes("deactivated on") 
       ? data.detail 
       : `Your account was deactivated on ${date}. Please contact support.`;
     return msg;
  }

  if (rawMessage.includes("not verified") || rawMessage.includes("unverified")) {
    return "Please verify your email before logging in.";
  }

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

const Login = () => {
  const navigate = useNavigate();
  const { login, fetchProfile } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      setApiError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      const data = await authService.login(formData.email, formData.password);

      // Save token and user details
      const token = data?.token || data?.access_token;
      if (token) {
        login(token, data.user || null);

        // If backend didn't return user object, fetch profile separately
        if (!data.user) {
          await fetchProfile();
        }

        navigate("/dashboard");
      } else {
        setApiError("Invalid response from server. Missing access token.");
      }
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setIsLoading(true);
    setApiError("");

    try {
      const data = await authService.googleLogin(credential);
      const token = data?.token || data?.access_token;

      if (token) {
        login(token, data.user || null);

        if (!data.user) {
          await fetchProfile();
        }

        navigate("/dashboard");
      } else {
        setApiError("Google login failed. Missing access token.");
      }
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
      <Card className="relative rounded-3xl border border-app surface p-8 shadow-xl lg:p-10">

        {/* Theme Toggle */}

        <div className="absolute right-6 top-6">

        </div>

        {/* Logo */}
        <Logo className="mb-8" />

        <AuthHeader
          title="Welcome Back 👋"
          subtitle="Sign in to continue your QuizGen AI account."
        />

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >
          {apiError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {apiError}
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
          />

          <PasswordInput
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-app-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() =>
                  setRememberMe(!rememberMe)
                }
                className="rounded border-app accent-violet-600"
              />

              Remember Me
            </label>

            <Link
              to="/forgot-password"
              className="font-medium text-violet-600 hover:text-violet-700"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Signing In...
              </span>
            ) : (
              <>
                Continue
                <ArrowRight
                  size={18}
                  className="ml-2"
                />
              </>
            )}
          </Button>
        </form>

        <div className="my-7">
          <AuthDivider />
        </div>

        <div className="space-y-4">
          <SocialButton provider="google" onSuccess={handleGoogleSuccess} />
        </div>

        <p className="mt-8 text-center text-sm text-app-muted">
          Don't have an account?{" "}

          <Link
            to="/signup"
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            Create Account
          </Link>
        </p>
      </Card>
    </motion.div>
  );
};

export default Login;
