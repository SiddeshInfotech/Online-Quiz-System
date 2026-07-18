import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

function FeatureCard({ icon, title, description }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.25 }}
      className="group interactive-glow rounded-3xl border border-app surface-elev p-8 shadow-sm hover:border-[var(--accent)] hover:shadow-xl"
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] transition group-hover:scale-110">
        {icon}
      </div>

      <h3 className="mb-3 text-xl font-semibold text-app">
        {title}
      </h3>

      <p className="mb-6 text-app-2 leading-7">
        {description}
      </p>

      <ArrowUpRight className="text-[var(--accent)] transition group-hover:translate-x-1 group-hover:-translate-y-1" />
    </motion.div>
  );
}

export default FeatureCard;