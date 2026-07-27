import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/Landing/Hero";
import TrustedCompanies from "../components/Landing/TrustedCompanies";
import HowItWorks from "../components/Landing/HowItWorks";
import Features from "../components/Landing/Features";
import Testimonials from "../components/Landing/Testimonials";
import CTA from "../components/Landing/CTA";
import Footer from "../components/layout/Footer";
import AuthModal from "../components/auth/AuthModal";
import { useAuthModal } from "../context/AuthModalContext";
import useAuthGuard from "../hooks/useAuthGuard";

function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useAuthModal();

  // 🔐 Login & Landing Guard: if the user has a valid token, redirect to dashboard.
  // The silent-refresh interceptor in api.js handles expired tokens transparently.
  const { isCheckingAuth } = useAuthGuard();

  useEffect(() => {
    // Don't open modals while auth check is in progress (avoid flash)
    if (isCheckingAuth) return;

    const path = location.pathname;
    const searchParams = Object.fromEntries(new URLSearchParams(location.search));

    if (path === "/login") {
      openModal("login", searchParams);
    } else if (path === "/signup") {
      openModal("signup", searchParams);
    } else if (path === "/forgot-password") {
      openModal("forgot-password", searchParams);
    } else if (path === "/verify-otp") {
      openModal("verify-otp", searchParams);
    } else if (path === "/verify-email") {
      openModal("verify-email", searchParams);
    } else if (path === "/reset-password") {
      openModal("reset-password", searchParams);
    }

    if (path !== "/") {
      const target = location.search ? `/${location.search}` : "/";
      navigate(target, { replace: true });
    }
  }, [isCheckingAuth, location.pathname, location.search, openModal, navigate]);

  // Suppress landing page content while the guard is resolving to prevent
  // a brief flash before the redirect kicks in.
  if (isCheckingAuth) return null;

  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <TrustedCompanies />
        <HowItWorks />
        <Features />
        <Testimonials />
        <CTA />
      </main>

      <Footer />
      <AuthModal />
    </>
  );
}

export default LandingPage;