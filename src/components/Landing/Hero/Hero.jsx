import Container from "../../ui/Container";
import HeroContent from "./HeroContent";
import landingVideo from "../../../assets/videos/landing.mp4";

function Hero() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-28">
      {/* Video Background - muted ensures no audio/music is played */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover opacity-30 dark:opacity-20"
      >
        <source src={landingVideo} type="video/mp4" />
      </video>

      {/* Ambient signature glow  violet in light, gold+blue in dark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 15% 20%, var(--hero-glow-1), transparent 60%)," +
            "radial-gradient(50% 50% at 90% 15%, var(--hero-glow-2), transparent 55%)",
        }}
      />
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px)," +
            "linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(70% 60% at 50% 40%, #000, transparent)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 40%, #000, transparent)",
        }}
      />
      <Container>
        <div className="max-w-2xl text-left">
          <HeroContent />
        </div>
      </Container>
    </section>
  );
}

export default Hero;
