import { Play, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";

const perks = ["Free forever", "No credit card", "AI powered"];

function HeroContent() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-xl"
    >
      <Badge className="mb-6">
        <Sparkles size={14} className="mr-2" />
        AI-powered quiz generation
      </Badge>

      <h1 className="text-5xl font-bold leading-tight text-app lg:text-6xl">
        Create smarter
        <br />
        quizzes
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: "var(--grad-primary)" }}
        >
          {" "}in seconds
        </span>
      </h1>

      <p className="mt-6 text-lg leading-8 text-app-2">
        Turn any topic into a ready-to-play quiz. Generate, share, and track
        results for students, teachers, and teams  all from one click.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link to="/signup">
          <Button size="lg">Get started free</Button>
        </Link>

        <a href="#how-it-works">
          <Button variant="secondary" size="lg">
            <Play size={18} className="mr-2" />
            See how it works
          </Button>
        </a>
      </div>

      <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-app-muted">
        {perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2">
            <Check size={16} className="text-[var(--accent)]" />
            {perk}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default HeroContent;
