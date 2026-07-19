import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Build page numbers with ellipsis
  const getPages = () => {
    const pages = [];
    const maxVisible = 4;

    for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) {
      pages.push(i);
    }

    if (totalPages > maxVisible + 1) {
      pages.push("...");
    }

    if (totalPages > maxVisible) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPages();

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5 mt-8"
    >
      {/* Previous */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="
          inline-flex items-center gap-1 h-9 px-3
          rounded-lg text-xs font-medium text-app-muted
          hover:text-violet-600 hover:bg-violet-50
          disabled:opacity-40 disabled:pointer-events-none
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
        "
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
        Previous
      </button>

      {/* Page Numbers */}
      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-9 h-9 flex items-center justify-center text-xs text-slate-400"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              w-9 h-9 rounded-lg text-xs font-semibold
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
              ${
                currentPage === page
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "text-slate-600 hover:bg-violet-50 hover:text-violet-600"
              }
            `}
            aria-current={currentPage === page ? "page" : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="
          inline-flex items-center gap-1 h-9 px-3
          rounded-lg text-xs font-medium text-app-muted
          hover:text-violet-600 hover:bg-violet-50
          disabled:opacity-40 disabled:pointer-events-none
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
        "
        aria-label="Next page"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </nav>
  );
};

export default Pagination;
