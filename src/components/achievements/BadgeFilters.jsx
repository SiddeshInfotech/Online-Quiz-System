const BadgeFilters = ({ filters, activeFilter, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            activeFilter === filter
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default BadgeFilters;
