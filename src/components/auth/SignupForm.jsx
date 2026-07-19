import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, UserPlus } from "lucide-react";

import AuthHeader from "./AuthHeader";
import AuthDivider from "./AuthDivider";
import AuthFooter from "./AuthFooter";
import PasswordInput from "./PasswordInput";
import SocialButton from "./SocialButton";

import Input from "../../components/ui/Input";
import authService from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

const SignupForm = ({ onSuccess }) => {
    const navigate = useNavigate();
    const { login, fetchProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Reset errors aur loading state
        setError("");
        setIsLoading(true);

        // 2. Validations
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (!formData.username.trim()) {
            setError("Username is required");
            setIsLoading(false);
            return;
        }

        if (!formData.email.trim()) {
            setError("Email is required");
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

        // 3. Build payload
        const payload = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            first_name: formData.firstName,
            last_name: formData.lastName,
        };

        try {
            const response = await authService.register(payload);

            // 4. 🔥 SUCCESS: 201 status
            if (response.status === 201) {
                // Return kar do taaki neeche error wala block kabhi execute na ho
                if (onSuccess) {
                    onSuccess(formData.email);
                } else {
                    navigate("/login", {
                        state: {
                            message: "Registration successful! Please login with your credentials."
                        }
                    });
                }
                return; // <--- 🔥 YEH LINE SABSE IMPORTANT HAI
            } else {
                // Agar kabhi 201 ke alawa kuch aaye (rare)
                setError(`Unexpected status: ${response.status}`);
            }

        } catch (err) {
            if (err.response?.data) {
                const errorData = err.response.data;
                if (typeof errorData === 'object') {
                    const messages = Object.values(errorData).flat().join(" ");
                    setError(messages || "Registration failed. Please check your inputs.");
                } else {
                    setError(errorData || "Registration failed.");
                }
            } else if (err.request) {
                setError("Network error. Could not reach the server.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credential) => {
        setIsLoading(true);
        setError("");

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
                setError("Google login failed. Missing access token.");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.detail || "Google login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full rounded-3xl border border-app surface p-8 shadow-xl lg:p-10"
        >
            {/* Theme Toggle */}
            <div className="absolute right-5 top-5">

            </div>

            {/* Header */}
            <AuthHeader
                title="Create your account"
                subtitle="Start your journey with AI-powered quizzes."
            />

            {/* Error Display */}
            {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* 🔥 Username Field */}
                <div className="relative">
                    <Input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        leftIcon={UserPlus}
                        required
                    />
                </div>

                {/* First + Last Name */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        leftIcon={User}
                    />
                    <Input
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        leftIcon={User}
                    />
                </div>

                {/* Email */}
                <Input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    leftIcon={Mail}
                    required
                />

                {/* Password */}
                <PasswordInput
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                />

                {/* Confirm Password */}
                <PasswordInput
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                />

                {/* Checkbox */}
                <label className="flex cursor-pointer items-start gap-3 text-sm text-app-2">
                    <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded accent-violet-600"
                        required
                    />
                    <span>
                        I agree to the{" "}
                        <Link
                            to="/terms"
                            className="font-medium text-violet-600 hover:underline"
                        >
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                            to="/privacy"
                            className="font-medium text-violet-600 hover:underline"
                        >
                            Privacy Policy
                        </Link>
                    </span>
                </label>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-50"
                >
                    {isLoading ? "Creating Account..." : "Create Account →"}
                </button>
            </form>

            {/* Divider */}
            <div className="my-7">
                <AuthDivider />
            </div>
            <div className="space-y-4">
                <SocialButton provider="google" onSuccess={handleGoogleSuccess} />
            </div>

            {/* Footer */}
            <div className="mt-8">
                <AuthFooter
                    text="Already have an account?"
                    linkText="Sign In"
                    to="/login"
                />
            </div>
        </motion.div>
    );
};

export default SignupForm;