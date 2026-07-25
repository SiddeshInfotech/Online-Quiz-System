import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BadgeGrid from "./BadgeGrid";
import BadgeCard from "./BadgeCard";

const BadgeCategory = ({ category, badges, onClaim }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!badges || badges.length === 0) return null;

  return (
    <div className="mb-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-4 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-xl p-1"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold font-space-grotesk text-slate-100 group-hover:text-violet-400 transition-colors">
            {category}
          </h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/80">
            {badges.length}
          </span>
        </div>
        <div className="p-1.5 rounded-lg text-slate-400 group-hover:bg-slate-800 group-hover:text-slate-200 transition-colors">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <BadgeGrid>
              {badges.map((badge) => (
                <BadgeCard key={badge.id || badge.badge_id} badge={badge} onClaim={onClaim} />
              ))}
            </BadgeGrid>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BadgeCategory;
