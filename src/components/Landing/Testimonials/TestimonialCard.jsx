import { motion } from "framer-motion";
import { Star } from "lucide-react";

function TestimonialCard({ name, role, message }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="interactive-glow rounded-3xl border border-app surface-elev p-8 shadow-sm hover:shadow-xl"
    >
      <div className="mb-4 flex gap-1 text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={18} fill="currentColor" />
        ))}
      </div>

      <p className="leading-7 text-app-2">
        "{message}"
      </p>

      <div className="mt-6">
        <h4 className="font-semibold text-app">{name}</h4>
        <p className="text-sm text-app-muted">{role}</p>
      </div>
    </motion.div>
  );
}

export default TestimonialCard;