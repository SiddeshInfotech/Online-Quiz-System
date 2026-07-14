import { motion } from "framer-motion";
import { Star } from "lucide-react";

function TestimonialCard({ name, role, message }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl"
    >
      <div className="mb-4 flex gap-1 text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={18} fill="currentColor" />
        ))}
      </div>

      <p className="leading-7 text-slate-600">
        "{message}"
      </p>

      <div className="mt-6">
        <h4 className="font-semibold">{name}</h4>
        <p className="text-sm text-slate-500">{role}</p>
      </div>
    </motion.div>
  );
}

export default TestimonialCard;