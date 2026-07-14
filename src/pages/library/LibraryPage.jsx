import { useState, useCallback, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import CategoryTabs from "../../components/library/CategoryTabs";
import QuizGrid from "../../components/library/QuizGrid";
import FilterDrawer from "../../components/library/FilterDrawer";
import libraryService from "../../services/libraryService";
import useDebounce from "../../hooks/useDebounce";

import {
  categories as PROGRAMMING_CATEGORIES,
  subjectOptions,
  difficultyOptions,
  statusOptions,
  durationOptions,
  sortOptions,
} from "../../constants/libraryMockData";

// Mapper function for API data to Component format
const mapQuizData = (item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  subject: item.category_name || "General",
  classLevel: item.class_level || "",
  questions: item.total_questions || 0,
  duration: item.duration_minutes || 0,
  difficulty: item.difficulty || "Medium",
  progress: item.progress_percentage || 0,
  subjectColor: "bg-violet-100 text-violet-700", // Fallback, could map based on subject
  thumbnail: item.thumbnail || "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80",
});

const LibraryPage = () => {
  // ── State ──
  // Always use the static programming categories; backend results enrich quizzes but don't overwrite these.
  const [categories] = useState(PROGRAMMING_CATEGORIES);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [metaMessage, setMetaMessage] = useState("");
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [error, setError] = useState(null);

  // ── Category Tabs ──
  const [activeCategory, setActiveCategory] = useState("all");

  // ── Filter Drawer State ──
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // ── Sort + Pagination + Search ──
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [currentSort, setCurrentSort] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filters ──
  const initialFilters = {
    subject: "All Subjects",
    difficulty: "All Difficulty",
    status: "All Status",
    duration: "Any Duration",
  };
  const [sidebarFilters, setSidebarFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const handleSidebarFilterChange = useCallback((key, value) => {
    setSidebarFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearSidebarFilters = useCallback(() => {
    setSidebarFilters(initialFilters);
    setSearchQuery("");
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...sidebarFilters });
    
    // Sync activeCategory with Filter Drawer subject
    if (sidebarFilters.subject === "All Subjects") {
      setActiveCategory("all");
    } else {
      const cat = categories.find(
        (c) => c.label.toLowerCase() === sidebarFilters.subject.toLowerCase()
      );
      if (cat) {
        setActiveCategory(cat.id);
      } else {
        // If it's a valid subject string without a mapped category, reset category to all
        setActiveCategory("all"); 
      }
    }

    setCurrentPage(1);
    setIsFilterDrawerOpen(false);
  }, [sidebarFilters, categories]);

  // ── Initial Fetch (Categories, Recommended, Meta) ──
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingInitial(true);
        const [catRes, metaRes] = await Promise.all([
          libraryService.getCategories(),
          libraryService.getLibraryMeta(),
        ]);
        
        // Categories are now static (programming-only); skip backend override.
        
        // Map Meta
        if (metaRes && metaRes.message) {
          setMetaMessage(metaRes.message);
        }
      } catch (err) {
        console.error("Error fetching initial library data:", err);
        setError("Failed to load library data.");
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  // ── Fetch Library Quizzes (Depends on filters) ──
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoadingLibrary(true);
        const params = {
          search: debouncedSearchQuery || undefined,
          subject: appliedFilters.subject !== "All Subjects" ? appliedFilters.subject : undefined,
          difficulty: appliedFilters.difficulty !== "All Difficulty" ? appliedFilters.difficulty : undefined,
          ordering: currentSort === "Newest" ? "-created_at" : currentSort === "Oldest" ? "created_at" : undefined,
          page: currentPage,
        };

        const res = await libraryService.getLibraryQuizzes(params);
        if (res && res.results) {
          setAllQuizzes(res.results.map(mapQuizData));
          setTotalPages(Math.ceil(res.count / 8) || 1); // Assuming 8 per page
        } else if (Array.isArray(res)) {
          setAllQuizzes(res.map(mapQuizData));
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Error fetching library quizzes:", err);
      } finally {
        setLoadingLibrary(false);
      }
    };
    fetchQuizzes();
  }, [debouncedSearchQuery, activeCategory, appliedFilters, currentSort, currentPage]);

  if (loadingInitial) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-violet-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-violet-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold font-space-grotesk text-slate-900 mb-1">
            Quiz Library
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            {metaMessage || `Explore ${allQuizzes.length}+ quizzes across ${categories.length - 1}+ categories`}
            <Sparkles size={14} className="text-amber-400" />
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={(id) => {
              setActiveCategory(id);
              setCurrentPage(1);

              // Sync Filter Drawer subject with category chip
              if (id === "all") {
                setSidebarFilters((prev) => ({ ...prev, subject: "All Subjects" }));
                setAppliedFilters((prev) => ({ ...prev, subject: "All Subjects" }));
              } else {
                const cat = categories.find((c) => c.id === id);
                if (cat) {
                  setSidebarFilters((prev) => ({ ...prev, subject: cat.label }));
                  setAppliedFilters((prev) => ({ ...prev, subject: cat.label }));
                }
              }
            }}
          />
        </motion.div>

        {/* All Quizzes Grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <QuizGrid
            quizzes={allQuizzes}
            isLoading={loadingLibrary}
            sortOptions={sortOptions}
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onOpenFilters={() => setIsFilterDrawerOpen(true)}
          />
        </motion.div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        sidebarFilters={sidebarFilters}
        onSidebarFilterChange={handleSidebarFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearSidebarFilters}
        subjectOptions={subjectOptions}
        difficultyOptions={difficultyOptions}
        statusOptions={statusOptions}
        durationOptions={durationOptions}
      />
    </div>
  );
};

export default LibraryPage;
