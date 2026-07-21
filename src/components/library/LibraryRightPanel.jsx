import { Link } from "react-router-dom";
import { Sparkles, ChevronDown } from "lucide-react";
import Button from "../ui/Button/Button";

const AiRecommendedItem = ({ item }) => (
  <Link
    to={`/quiz/${item.id}`}
    className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors group focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1"
  >
    {/* Avatar */}
    <div
      className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}
    >
      <span className="text-white text-xs font-bold">
        {item.title.charAt(0)}
      </span>
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <h4 className="text-xs font-semibold text-slate-800 truncate group-hover:text-violet-600 transition-colors">
        {item.title}
      </h4>
      <p className="text-[10px] text-slate-400">
        {item.subject} • {item.classLevel}
      </p>
    </div>

    {/* Match % */}
    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full flex-shrink-0">
      {item.match}% Match
    </span>
  </Link>
);

const SidebarFilterSelect = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-xs font-semibold text-app-2 mb-2">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          appearance-none w-full h-10 rounded-xl
          border border-app surface pl-3.5 pr-9
          text-xs font-medium text-app
          outline-none transition-all duration-200
          focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20
          hover:border-[var(--accent)] cursor-pointer
        "
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="surface text-app">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none"
      />
    </div>
  </div>
);

const LibraryRightPanel = ({
  aiList,
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
    <aside className="flex flex-col gap-8" aria-label="Library sidebar">
      {/* AI Recommended List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">
            AI Recommended for You
          </h3>
          <Link
            to="/library?tab=recommended"
            className="text-[10px] font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {aiList.map((item) => (
            <AiRecommendedItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800">Filters</h3>
          <button
            onClick={onClearFilters}
            className="text-[10px] font-semibold text-violet-600 hover:text-violet-700 transition-colors focus:outline-none"
          >
            Clear All
          </button>
        </div>

        <div className="flex flex-col gap-5">
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

          <Button
            variant="primary"
            size="sm"
            className="w-full mt-1"
            onClick={onApplyFilters}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default LibraryRightPanel;
