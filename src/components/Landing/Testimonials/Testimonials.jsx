import Container from "../../ui/Container";
import SectionHeading from "../../ui/SectionHeading";
import TestimonialCard from "./TestimonialCard";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Teacher",
    message:
      "QuizGen AI saves me hours every week while creating quizzes.",
  },
  {
    name: "Michael Lee",
    role: "Professor",
    message:
      "The interface is beautiful and quiz generation is incredibly fast.",
  },
  {
    name: "Emma Wilson",
    role: "Student",
    message:
      "Preparing for exams has become much easier with AI-generated quizzes.",
  },
];

function Testimonials() {
  return (
    <section className="bg-slate-50 py-24">
      <Container>
        <SectionHeading
          badge="Testimonials"
          title="Loved by Teachers & Students"
          description="Thousands of users trust QuizGen AI every day."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {testimonials.map((item) => (
            <TestimonialCard key={item.name} {...item} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Testimonials;