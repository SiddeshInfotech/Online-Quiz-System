import {
  Sparkles,
  BarChart3,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import Container from "../../ui/Container";
import SectionHeading from "../../ui/SectionHeading";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: <Sparkles size={26} />,
    title: "AI Quiz Generation",
    description:
      "Generate quizzes instantly using AI with customizable difficulty levels.",
  },
  {
    icon: <BarChart3 size={26} />,
    title: "Performance Analytics",
    description:
      "Track scores, progress, and learning performance with beautiful reports.",
  },
  {
    icon: <ShieldCheck size={26} />,
    title: "Secure Authentication",
    description:
      "Secure authentication to protect your account and quiz data.",
  },
  {
    icon: <Smartphone size={26} />,
    title: "Fully Responsive",
    description:
      "Works seamlessly across desktop, tablet, and mobile devices.",
  },
];

function Features() {
  return (
    <section id="about" className="surface py-24">
      <Container>
        <SectionHeading
          badge="Features"
          title="Everything You Need"
          description="Powerful tools to create, manage, and analyze quizzes effortlessly."
        />

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              {...feature}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Features;