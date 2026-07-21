import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Grid, Code, LayoutGrid } from "lucide-react";

// ─── Icon helper ─────────────────────────────────────────────────────────────
const getCategoryIcon = (label = "") => {
  const l = label.toLowerCase();
  if (l === "all" || l === "all categories") return <Grid size={14} />;
  if (l === "c" || l === "c++" || l === "c#") return <Code size={14} />;
  return <LayoutGrid size={14} />;
};

// ─── A single chip button ─────────────────────────────────────────────────────
const Chip = ({ cat, isActive, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.94 }}
    onClick={() => onClick(cat.id)}
    aria-pressed={isActive}
    className={`
      inline-flex items-center gap-1.5 rounded-full px-4 py-2
      text-sm font-semibold transition-all duration-200 whitespace-nowrap
      focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
      ${isActive
        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 border-transparent"
        : "surface text-app-2 border border-app hover:border-violet-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-[var(--bg-elevated)] hover:shadow-sm"
      }
    `}
  >
    {getCategoryIcon(cat.label)}
    {cat.label}
  </motion.button>
);

// ─── Main component ───────────────────────────────────────────────────────────
const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [search, setSearch] = useState("");
  const moreRef = useRef(null);
  const searchRef = useRef(null);

  // Number of pinned chips (excluding "All")
  const PINNED_LABELS = ["All Categories", "C", "Java", "Python", "JavaScript", "React"];

  // Split categories into pinned (visible) vs overflow (in More)
  const pinned = categories.filter((c) =>
    PINNED_LABELS.some((p) => p.toLowerCase() === c.label.toLowerCase())
  );

  // Ensure "All" always first in pinned
  const allChip = pinned.find((c) => c.label.toLowerCase().includes("all"));
  const restPinned = pinned.filter((c) => !c.label.toLowerCase().includes("all"));
  const orderedPinned = allChip ? [allChip, ...restPinned] : restPinned;

  const overflow = categories.filter(
    (c) => !PINNED_LABELS.some((p) => p.toLowerCase() === c.label.toLowerCase())
  );

  // Filter overflow by search
  const filteredOverflow = overflow.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (moreOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [moreOpen]);

  // Is the active category inside the overflow list?
  const activeInOverflow = overflow.some((c) => c.id === activeCategory);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Pinned chips */}
      {orderedPinned.map((cat) => (
        <Chip
          key={cat.id}
          cat={cat}
          isActive={activeCategory === cat.id}
          onClick={onCategoryChange}
        />
      ))}

      {/* More button + dropdown */}
      {overflow.length > 0 && (
        <div className="relative" ref={moreRef}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setMoreOpen((v) => !v)}
            className={`
              inline-flex items-center gap-1.5 rounded-full px-4 py-2
              text-sm font-semibold transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
              ${activeInOverflow
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 border-transparent"
                : "surface text-app-2 border border-app hover:border-violet-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-[var(--bg-elevated)] hover:shadow-sm"
              }
            `}
          >
            {activeInOverflow
              ? overflow.find((c) => c.id === activeCategory)?.label ?? "More"
              : "More"}
            <motion.span
              animate={{ rotate: moreOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              <ChevronDown size={14} />
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-2 z-50 w-64 rounded-2xl surface border border-app shadow-2xl overflow-hidden"
              >
                {/* Search box */}
                <div className="p-3 border-b border-app">
                  <div className="relative flex items-center">
                    <Search size={14} className="absolute left-3 text-app-muted pointer-events-none" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search subjects…"
                      className="w-full pl-8 pr-3 py-2 text-sm surface-subtle border border-app rounded-xl outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/20 text-app placeholder:text-app-muted transition-all"
                    />
                  </div>
                </div>

                {/* Subject list */}
                <div className="max-h-56 overflow-y-auto py-2 no-scrollbar">
                  {filteredOverflow.length === 0 ? (
                    <p className="text-xs text-app-muted text-center py-4">No subjects found</p>
                  ) : (
                    filteredOverflow.map((cat) => {
                      const isActive = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            onCategoryChange(cat.id);
                            setMoreOpen(false);
                            setSearch("");
                          }}
                          className={`
                            w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2
                            ${isActive
                              ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 font-semibold"
                              : "text-app-2 hover:bg-[var(--bg-elevated)] hover:text-violet-600 dark:hover:text-violet-400"
                            }
                          `}
                        >
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-600 flex-shrink-0" />
                          )}
                          {cat.label}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CategoryTabs;
