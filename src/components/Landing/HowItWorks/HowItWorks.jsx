import {
  FileText,
  Sparkles,
} from "lucide-react";

import Container from "../../ui/Container";
import SectionHeading from "../../ui/SectionHeading";
import StepCard from "./StepCard";

const steps = [
  {
    icon: <FileText size={26} />,
    title: "Choose Topic",
    description:
      "Enter any subject and select the number of questions.",
  },
  {
    icon: <Sparkles size={26} />,
    title: "Generate Quiz",
    description:
      "AI creates a complete quiz instantly with answers.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="surface-subtle py-24">
      <Container>
        <SectionHeading
          badge="How It Works"
          title="Create a Quiz in 2 Simple Steps"
          description="Generate quizzes within seconds using AI."
        />

        <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {steps.map((step) => (
            <StepCard key={step.title} {...step} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default HowItWorks;