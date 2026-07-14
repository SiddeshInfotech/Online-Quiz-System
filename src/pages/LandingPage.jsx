import Navbar from "../components/layout/Navbar";
import Hero from "../components/landing/Hero";
import TrustedCompanies from "../components/landing/TrustedCompanies";
import HowItWorks from "../components/landing/HowItWorks";
import Features from "../components/landing/Features";
import Testimonials from "../components/landing/Testimonials";
import CTA from "../components/landing/CTA";
import Footer from "../components/layout/Footer";

function LandingPage() {
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
    </>
  );
}

export default LandingPage;