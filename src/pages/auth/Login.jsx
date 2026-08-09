import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import authService from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import { useAuthModal } from "../../context/AuthModalContext";
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

const Login = ({ inModal = false }) => {
  const navigate = useNavigate();
  const { login, fetchProfile } = useAuth();
  const { changeView, closeModal, formData, updateFormData } = useAuthModal();
  const [rememberMe, setRememberMe] = useState(false);

  const [localFormData, setLocalFormData] = useState({
    email: formData?.email || "",
    password: formData?.password || "",
  });

  // Keep modal state in sync when switching views
  useEffect(() => {
    updateFormData({ email: localFormData.email });
  }, [localFormData.email, updateFormData]);

  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setLocalFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!localFormData.email.trim() || !localFormData.password.trim()) {
      setApiError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      const data = await authService.login(localFormData.email, localFormData.password);

      // 💾 Save new JWT tokens & user object to localStorage
      const token = data?.token || data?.access_token || data?.access;
      const refreshToken = data?.refresh || data?.refresh_token;

      if (token) {
        localStorage.setItem("access_token", token);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("user_data", JSON.stringify(data.user));
        }

        login(token, data.user || null, refreshToken);

        // If backend didn't return user object, fetch profile separately
        if (!data.user) {
          await fetchProfile();
        }

        if (inModal) closeModal();
        // 🚀 Navigate to Dashboard
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
      const token = data?.token || data?.access_token || data?.access;
      const refreshToken = data?.refresh || data?.refresh_token;

      if (token) {
        login(token, data.user || null, refreshToken);

        if (!data.user) {
          await fetchProfile();
        }

        if (inModal) closeModal();
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full"
    >
      <div className={!inModal ? "relative rounded-3xl border border-app surface p-8 shadow-xl lg:p-10" : ""}>
        {!inModal && <Logo className="mb-8" />}

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
            value={localFormData.email}
            onChange={handleChange}
            leftIcon={Mail}
          />

          <PasswordInput
            label="Password"
            name="password"
            value={localFormData.password}
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

            {inModal ? (
              <button
                type="button"
                onClick={() => changeView("forgot-password")}
                className="font-medium text-violet-600 hover:text-violet-700"
              >
                Forgot Password?
              </button>
            ) : (
              <a
                href="/forgot-password"
                className="font-medium text-violet-600 hover:text-violet-700"
              >
                Forgot Password?
              </a>
            )}
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

          {inModal ? (
            <button
              type="button"
              onClick={() => changeView("signup")}
              className="font-semibold text-violet-600 hover:text-violet-700"
            >
              Create Account
            </button>
          ) : (
            <a
              href="/signup"
              className="font-semibold text-violet-600 hover:text-violet-700"
            >
              Create Account
            </a>
          )}
        </p>
      </div>
    </motion.div>
  );
};

export default Login;
