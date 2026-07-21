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

function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useAuthModal();

  useEffect(() => {
    const path = location.pathname;
    if (path === "/login") {
      openModal("login");
    } else if (path === "/signup") {
      openModal("signup");
    } else if (path === "/forgot-password") {
      openModal("forgot-password");
    } else if (path === "/verify-otp") {
      openModal("verify-otp");
    } else if (path === "/reset-password") {
      openModal("reset-password");
    }
    // Remove the path from URL to just / without reloading
    if (path !== "/") {
      navigate("/", { replace: true });
    }
  }, [location, openModal, navigate]);

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