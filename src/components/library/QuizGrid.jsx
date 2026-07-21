import { useState } from "react";
import { LayoutGrid, List, ChevronDown, Loader2 } from "lucide-react";
import QuizCard from "./QuizCard";
import Pagination from "./Pagination";

const QuizCardSkeleton = ({ viewMode }) => {
  if (viewMode === "list") {
    return (
      <div className="flex items-center gap-5 p-4 rounded-2xl surface border border-app shadow-sm animate-pulse">
        <div className="w-24 h-20 rounded-xl surface-elev flex-shrink-0" />
        <div className="flex-1">
          <div className="h-5 surface-elev rounded w-1/3 mb-2" />
          <div className="h-3 surface-elev rounded w-1/4" />
        </div>
        <div className="hidden sm:flex gap-4">
          <div className="h-4 surface-elev rounded w-12" />
          <div className="h-4 surface-elev rounded w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl surface border border-app shadow-sm h-[340px] flex flex-col animate-pulse">
      <div className="h-[180px] surface-elev rounded-t-2xl" />
      <div className="p-5 flex-1 flex flex-col">
        <div className="h-5 surface-elev rounded w-3/4 mb-2" />
        <div className="h-3 surface-elev rounded w-1/2 mb-4" />
        <div className="flex gap-4 mb-4">
          <div className="h-4 surface-elev rounded w-12" />
          <div className="h-4 surface-elev rounded w-16" />
        </div>
        <div className="mt-auto">
          <div className="h-9 surface-elev rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
};

const QuizGrid = ({
  quizzes,
  isLoading,
  sortOptions,
  currentSort,
  onSortChange,
  currentPage,
  totalPages,
  onPageChange,
  onOpenFilters,
}) => {
  const [viewMode, setViewMode] = useState("grid");
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <section aria-label="All quizzes">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold font-space-grotesk text-app">
          All Quizzes
        </h2>

        <div className="flex items-center gap-3">
          {/* Filter Button */}
          <button
            onClick={onOpenFilters}
            className="
              inline-flex items-center gap-2 h-9 px-4
              rounded-lg border border-app surface
              text-xs font-semibold text-app-2
              hover:bg-slate-50 hover:border-slate-300 transition-all
              focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
            "
            aria-label="Open filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-muted"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filters
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="
                inline-flex items-center gap-2 h-9 px-3
                rounded-lg border border-app surface
                text-xs font-medium text-slate-600
                hover:border-slate-300 transition-all
                focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
              "
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
            >
              <span className="text-slate-400">Sort by:</span>
              <span className="font-semibold text-app-2">{currentSort}</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${
                  sortOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 surface rounded-xl border border-app shadow-xl z-20 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onSortChange(opt);
                      setSortOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2 text-xs font-medium transition-colors
                      ${
                        currentSort === opt
                          ? "text-violet-600 bg-violet-50"
                          : "text-slate-600 hover:bg-slate-50 hover:text-violet-600"
                      }
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-app overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`
                w-9 h-9 flex items-center justify-center transition-colors
                focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-inset
                ${
                  viewMode === "grid"
                    ? "bg-violet-600 text-white"
                    : "surface text-slate-400 hover:text-slate-600"
                }
              `}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`
                w-9 h-9 flex items-center justify-center transition-colors
                focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-inset
                ${
                  viewMode === "list"
                    ? "bg-violet-600 text-white"
                    : "surface text-slate-400 hover:text-slate-600"
                }
              `}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Cards */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              : "flex flex-col gap-3"
          }
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <QuizCardSkeleton key={idx} viewMode={viewMode} />
          ))}
        </div>
      ) : quizzes && quizzes.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              : "flex flex-col gap-3"
          }
        >
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 gap-3 surface rounded-2xl border border-app shadow-sm">
          <div className="w-14 h-14 rounded-2xl surface-subtle flex items-center justify-center text-slate-400">
            <LayoutGrid size={26} />
          </div>
          <p className="text-sm font-semibold text-app-muted">
            No quizzes found.
          </p>
          <p className="text-xs text-slate-400">
            Try adjusting your filters or search query.
          </p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && quizzes && quizzes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
};

export default QuizGrid;
