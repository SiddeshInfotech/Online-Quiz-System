import Navbar from "../components/layout/Navbar";
import Hero from "../components/Landing/Hero";
import TrustedCompanies from "../components/Landing/TrustedCompanies";
import HowItWorks from "../components/Landing/HowItWorks";
import Features from "../components/Landing/Features";
import Testimonials from "../components/Landing/Testimonials";
import CTA from "../components/Landing/CTA";
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