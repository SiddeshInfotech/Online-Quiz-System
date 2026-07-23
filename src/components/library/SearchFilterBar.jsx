import { Search, ChevronDown, RotateCcw } from "lucide-react";

const SelectDropdown = ({ value, options, onChange, label }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="
        appearance-none h-11 w-full min-w-[140px] rounded-xl
        border border-app surface pl-4 pr-10
        text-sm font-medium text-app-2
        outline-none transition-all duration-200
        focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20
        hover:border-app cursor-pointer
      "
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="surface text-app">
          {opt}
        </option>
      ))}
    </select>
    <ChevronDown
      size={16}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none"
    />
  </div>
);

const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  subject,
  onSubjectChange,
  difficulty,
  onDifficultyChange,
  status,
  onStatusChange,
  onReset,
  subjectOptions,
  difficultyOptions,
  statusOptions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl surface border border-app p-3 shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search quizzes..."
          aria-label="Search quizzes"
          className="
            h-11 w-full rounded-xl border border-app surface-subtle
            pl-10 pr-4 text-sm text-app-2
            outline-none transition-all duration-200
            placeholder:text-app-muted
            focus:border-violet-400 focus:surface focus:ring-2 focus:ring-violet-500/20
          "
        />
      </div>

      {/* Dropdowns */}
      <div className="flex items-center gap-3 flex-wrap">
        <SelectDropdown
          value={subject}
          options={subjectOptions}
          onChange={onSubjectChange}
          label="Filter by subject"
        />
        <SelectDropdown
          value={difficulty}
          options={difficultyOptions}
          onChange={onDifficultyChange}
          label="Filter by difficulty"
        />
        <SelectDropdown
          value={status}
          options={statusOptions}
          onChange={onStatusChange}
          label="Filter by status"
        />

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="
            inline-flex items-center gap-2 h-11 px-4
            rounded-xl border border-app surface
            text-sm font-medium text-app-muted
            hover:text-violet-600 hover:border-violet-300
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
          "
          aria-label="Reset filters"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
};

export default SearchFilterBar;
