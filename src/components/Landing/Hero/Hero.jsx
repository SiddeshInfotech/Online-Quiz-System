import Container from "../../ui/Container";
import HeroContent from "./HeroContent";
import DashboardPreview from "./DashboardPreview";

function Hero() {
  return (
    <section className="bg-slate-50 py-24">
      <Container>
        <div className="grid items-center gap-20 lg:grid-cols-2">
          <HeroContent />
          <DashboardPreview />
        </div>
      </Container>
    </section>
  );
}

export default Hero;