import { ArrowRight } from "lucide-react";
import Container from "../../ui/Container";
import Button from "../../ui/Button";
import { Link } from "react-router-dom";

function CTA() {
  return (
    <section className="py-24">
      <Container>
        <div className="rounded-[32px] bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-20 text-center text-white">
          <h2 className="text-4xl font-bold">
            Ready to Create Smarter Quizzes?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-violet-100">
            Join thousands of teachers and students using QuizGen AI.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button>
                Get Started Free
              </Button>
            </Link>

            <Button variant="cta">
  Learn More
</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default CTA;