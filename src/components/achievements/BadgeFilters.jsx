const BadgeFilters = ({ filters, activeFilter, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Badge filters">
      {filters.map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <button
            key={filter}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              isActive
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/25 border border-violet-500 font-bold"
                : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
};

export default BadgeFilters;
