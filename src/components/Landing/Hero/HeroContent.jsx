import { ArrowRight, Play, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import { Link } from "react-router-dom";

function HeroContent() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-xl"
    >
      <Badge className="mb-6">
        <Sparkles size={14} className="mr-2" />
        AI Powered Quiz Generation
      </Badge>

      <h1 className="text-5xl font-bold leading-tight text-slate-900 lg:text-6xl">
        Create Smarter
        <br />
        Quizzes
        <span className="text-violet-600"> in Seconds</span>
      </h1>

      <p className="mt-6 text-lg leading-8 text-slate-500">
        Generate AI-powered quizzes instantly for students,
        teachers and organizations with one click.
      </p>

      <div className="mt-10 flex flex-wrap gap-4"varient="secondary"size="lg">
      <Link to="/signup">
        <Button className="w-full">
          Get Started Free
        </Button>
      </Link>

        <Button variant="secondary" size="lg">
          <Play size={18} className="mr-2" />
          See How It Works
        </Button>
      </div>

      <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
        <span>✔ Free Forever</span>
        <span>✔ No Credit Card</span>
        <span>✔ AI Powered</span>
      </div>
    </motion.div>
  );
}

export default HeroContent;