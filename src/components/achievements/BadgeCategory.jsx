import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BadgeGrid from "./BadgeGrid";
import BadgeCard from "./BadgeCard";

const BadgeCategory = ({ category, badges, onClaim }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!badges || badges.length === 0) return null;

  return (
    <div className="mb-12">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-6 group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold font-space-grotesk text-slate-800 group-hover:text-violet-600 transition-colors">
            {category}
          </h2>
          <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {badges.length}
          </span>
        </div>
        <div className="p-1 rounded-md text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors">
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
                <BadgeCard key={badge.id} badge={badge} onClaim={onClaim} />
              ))}
            </BadgeGrid>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BadgeCategory;
