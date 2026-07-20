import { ArrowRight } from "lucide-react";
import Container from "../../ui/Container";
import Button from "../../ui/Button";
import { Link } from "react-router-dom";

function CTA() {
  return (
    <section id="contact" className="py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[32px] px-8 py-20 text-center text-white [background:var(--grad-primary)]">
          <h2 className="text-4xl font-bold">
            Ready to Create Smarter Quizzes?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">
            Join thousands of teachers and students using QuizGen AI.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button variant="cta">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default CTA;