import { useRef, useState } from "react";
import { Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import RecommendedCard from "./RecommendedCard";

const RecommendedSkeleton = () => (
  <div className="min-w-[260px] md:min-w-[280px] h-[260px] surface rounded-2xl border border-app shadow-sm p-4 flex flex-col animate-pulse">
    <div className="w-full h-32 surface-subtle rounded-xl mb-4" />
    <div className="h-4 surface-subtle rounded w-3/4 mb-2" />
    <div className="h-3 surface-subtle rounded w-1/2 mb-4" />
    <div className="mt-auto flex justify-between">
      <div className="h-4 surface-subtle rounded w-1/4" />
      <div className="h-4 surface-subtle rounded w-1/4" />
    </div>
  </div>
);

const RecommendedSection = ({ quizzes, isLoading }) => {
  const scrollRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
    // Re-check after animation
    setTimeout(checkScroll, 350);
  };

  if (!isLoading && (!quizzes || quizzes.length === 0)) return null;

  return (
    <section aria-label="AI Recommended quizzes">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-violet-600" />
          <h2 className="text-lg font-bold font-space-grotesk text-app">
            Recommended for You
          </h2>
        </div>
        <Link
          to="/library?tab=recommended"
          className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
        >
          View All
        </Link>
      </div>
      <p className="text-xs text-app-muted mb-5">
        Quizzes picked based on your learning progress and interests
      </p>

      {/* Carousel */}
      <div className="relative group/carousel">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {isLoading ? (
            <>
              <RecommendedSkeleton />
              <RecommendedSkeleton />
              <RecommendedSkeleton />
              <RecommendedSkeleton />
            </>
          ) : (
            quizzes.map((quiz) => (
              <RecommendedCard key={quiz.id} quiz={quiz} />
            ))
          )}
        </div>

        {/* Left Arrow */}
        {canScrollLeft && !isLoading && (
          <button
            onClick={() => scroll("left")}
            className="
              absolute -left-3 top-1/2 -translate-y-1/2 z-10
              w-9 h-9 rounded-full surface border border-app shadow-lg
              flex items-center justify-center
              text-app-2 hover:text-violet-500 dark:hover:text-violet-400 hover:border-[var(--accent)]
              transition-all duration-200
              opacity-0 group-hover/carousel:opacity-100
              focus:outline-none focus:ring-2 focus:ring-violet-400
            "
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && !isLoading && (
          <button
            onClick={() => scroll("right")}
            className="
              absolute -right-3 top-1/2 -translate-y-1/2 z-10
              w-9 h-9 rounded-full surface border border-app shadow-lg
              flex items-center justify-center
              text-app-2 hover:text-violet-500 dark:hover:text-violet-400 hover:border-[var(--accent)]
              transition-all duration-200
              opacity-0 group-hover/carousel:opacity-100
              focus:outline-none focus:ring-2 focus:ring-violet-400
            "
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </section>
  );
};

export default RecommendedSection;
