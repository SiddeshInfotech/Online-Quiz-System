import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

import Logo from "../../components/ui/Logo";

const BrandPanel = () => {
  return (
    <section className="relative hidden overflow-hidden lg:flex">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-slate-950 to-indigo-950" />

      {/* Decorative Glow */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex h-full w-full flex-col justify-between p-12"
      >
        {/* ================= TOP ================= */}

        <div>
          {/* Logo */}
          <Logo className="mb-12" isDarkBg={true} />

          {/* Badge */}

          <span className="inline-flex rounded-full bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 backdrop-blur">
            AI-Powered Quiz Generation Platform
          </span>

          {/* Heading */}

          <h1 className="mt-8 font-space-grotesk text-6xl font-bold leading-tight text-white">
            Create Smarter
            <br />
            Quizzes{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              with AI
            </span>
          </h1>

          {/* Description */}

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Generate high-quality quizzes in seconds from any topic or
            document. Save time and enhance every learning experience.
          </p>

          {/* Features */}

          <div className="mt-10 flex flex-wrap gap-3">
            <Feature icon={<Sparkles size={18} />} text="AI Generated" />
            <Feature icon={<Zap size={18} />} text="Instant Results" />
            <Feature icon={<BarChart3 size={18} />} text="Smart Analytics" />
          </div>
        </div>

        {/* ================= DASHBOARD ================= */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mt-12"
        >
        

          
          {/* Main Dashboard */}

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

            {/* Header */}

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h3 className="text-xl font-bold text-white">
                  AI Quiz Generator
                </h3>

                <p className="text-sm text-slate-400">
                  Live Dashboard Preview
                </p>
              </div>

              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                Online
              </span>

            </div>

            {/* Subject */}

            <div className="mb-6 rounded-2xl bg-white/5 p-4">

              <p className="text-sm text-slate-400">
                Subject
              </p>

              <h4 className="mt-1 text-lg font-semibold text-white">
                Python Programming
              </h4>

            </div>

            {/* Progress */}

            <div className="mb-6">

              <div className="mb-2 flex justify-between">

                <span className="text-sm text-slate-300">
                  Generating Questions
                </span>

                <span className="text-sm text-violet-300">
                  92%
                </span>

              </div>

              <div className="h-3 rounded-full bg-white/10">

                <div className="h-3 w-[92%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />

              </div>

            </div>

            {/* Activity */}

            <div className="space-y-3">

              <Activity text="Understanding Topic" />

              <Activity text="Generating Questions" />

              <Activity text="Creating Answers" />

              <Activity text="Finalizing Quiz" pending />

            </div>

          </div>
        </motion.div>

      </motion.div>
    </section>
  );
};

const Feature = ({ icon, text }) => (
  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur">
    {icon}
    {text}
  </div>
);

const Activity = ({ text, pending }) => (
  <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
    <CheckCircle2
      size={18}
      className={
        pending ? "text-app-muted" : "text-emerald-400"
      }
    />

    <span className="text-sm text-slate-200">
      {text}
    </span>
  </div>
);

export default BrandPanel;