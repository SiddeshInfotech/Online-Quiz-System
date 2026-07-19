import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Filter } from "lucide-react";
import Button from "../ui/Button/Button";

const SidebarFilterSelect = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-app-2 mb-2">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          appearance-none w-full h-11 rounded-xl
          border border-app surface pl-4 pr-10
          text-sm font-medium text-app-2
          outline-none transition-all duration-200
          focus:border-violet-400 focus:ring-4 focus:ring-violet-100
          hover:border-slate-300 cursor-pointer
        "
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  </div>
);

const FilterDrawer = ({
  isOpen,
  onClose,
  sidebarFilters,
  onSidebarFilterChange,
  onApplyFilters,
  onClearFilters,
  subjectOptions,
  difficultyOptions,
  statusOptions,
  durationOptions,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-violet-600" />
                <h2 className="text-lg font-bold font-space-grotesk text-slate-900">
                  Filters
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-500">
                  Filter Options
                </h3>
                <button
                  onClick={onClearFilters}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors focus:outline-none"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <SidebarFilterSelect
                  label="Subjects"
                  value={sidebarFilters.subject}
                  options={subjectOptions}
                  onChange={(v) => onSidebarFilterChange("subject", v)}
                />
                <SidebarFilterSelect
                  label="Difficulty"
                  value={sidebarFilters.difficulty}
                  options={difficultyOptions}
                  onChange={(v) => onSidebarFilterChange("difficulty", v)}
                />
                <SidebarFilterSelect
                  label="Status"
                  value={sidebarFilters.status}
                  options={statusOptions}
                  onChange={(v) => onSidebarFilterChange("status", v)}
                />
                <SidebarFilterSelect
                  label="Duration"
                  value={sidebarFilters.duration}
                  options={durationOptions}
                  onChange={(v) => onSidebarFilterChange("duration", v)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <Button
                variant="primary"
                className="w-full h-12 text-base font-semibold"
                onClick={() => {
                  onApplyFilters();
                  onClose();
                }}
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;
