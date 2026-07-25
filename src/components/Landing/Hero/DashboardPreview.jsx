import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuthModal } from "../../../context/AuthModalContext";

function DashboardPreview() {
  const { openModal } = useAuthModal();

  const handleGenerateClick = (e) => {
    if (openModal) {
      openModal("signup");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="interactive-glow surface-elev overflow-hidden rounded-3xl border border-app p-6 shadow-xl">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-app">Dashboard</h3>
            <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-500">
              Online
            </span>
          </div>

          {/* Signature gradient panel */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{ background: "var(--grad-primary)" }}
          >
            <h2 className="text-lg font-semibold">AI Quiz Generator</h2>
            <p className="mt-1 text-sm text-white/80">
              10 questions  Python  Medium
            </p>
            <Link
              to="/signup"
              onClick={handleGenerateClick}
              className="mt-5 inline-block rounded-xl bg-white px-5 py-3 text-sm font-medium text-[var(--accent)] transition hover:scale-105 dark:bg-[#0A0A0F] dark:text-[#F5C451]"
            >
              Generate quiz
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { name: "Python Basics", status: "Ready" },
              { name: "React Quiz", status: "Ready" },
              { name: "Java OOP", status: "Ready" },
            ].map((quiz) => (
              <div
                key={quiz.name}
                className="flex items-center justify-between rounded-xl border border-app p-4 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                <span className="text-app">{quiz.name}</span>
                <span className="text-xs text-app-muted">{quiz.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardPreview;
