import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Loader2, Search, RotateCcw, PlusCircle, UserCheck, Globe } from "lucide-react";
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
  quizModeOptions,
  sortOptions,
} from "../../constants/libraryMockData";

// Mapper function for API data to Component format
const mapQuizData = (item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  subject: item.category_name || item.subject || "General",
  classLevel: item.class_level || "",
  questions: item.total_questions || item.question_count || 0,
  duration: item.duration_minutes || item.duration || item.time_limit || 0,
  difficulty: item.difficulty || "Medium",
  progress: item.progress_percentage ?? item.progress ?? 0,
  createdByMe: item.created_by_me ?? false,
  is_admin_quiz: item.is_admin_quiz ?? false,
  created_by_label: item.created_by_label || (item.is_admin_quiz ? "QuizGen AI" : item.created_by_me ? "Created by You" : "User"),
  status: item.status || "published",
  subjectColor: "bg-violet-100 text-violet-700",
  thumbnail: item.thumbnail || "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80",
});

const LibraryPage = () => {
  // ── State ──
  const [categories, setCategories] = useState(PROGRAMMING_CATEGORIES);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [metaMessage, setMetaMessage] = useState("");
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [error, setError] = useState(null);

  // ── Scope Tab ("all" | "my_quizzes") ──
  const [scopeTab, setScopeTab] = useState("all");

  // ── Category Tabs ──
  const [activeCategory, setActiveCategory] = useState("all");

  // ── Filter Drawer State ──
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // ── Sort + Pagination + Search ──
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [currentSort, setCurrentSort] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filters ──
  const initialFilters = {
    subject: "All Subjects",
    difficulty: "All Difficulty",
    quizMode: "All Modes",
    status: "All Status",
    createdByMe: false,
  };
  const [sidebarFilters, setSidebarFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const handleSidebarFilterChange = useCallback((key, value) => {
    setSidebarFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearSidebarFilters = useCallback(() => {
    setSidebarFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setActiveCategory("all");
    setSearchQuery("");
    setCurrentPage(1);
  }, [initialFilters]);

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
        setActiveCategory("all"); 
      }
    }

    setCurrentPage(1);
    setIsFilterDrawerOpen(false);
  }, [sidebarFilters, categories]);

  // ── Initial Fetch (Categories, Meta) ──
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingInitial(true);
        const [catRes, metaRes] = await Promise.all([
          libraryService.getCategories().catch(() => null),
          libraryService.getLibraryMeta().catch(() => null),
        ]);
        
        if (catRes && Array.isArray(catRes) && catRes.length > 0) {
          const apiCats = catRes.map(c => ({
            id: c.id || String(c.name).toLowerCase(),
            label: c.name || c.label,
          }));
          setCategories([{ id: "all", label: "All Categories" }, ...apiCats]);
        }
        
        if (metaRes && metaRes.message) {
          setMetaMessage(metaRes.message);
        }
      } catch (err) {
        console.error("Error fetching initial library data:", err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  // ── Fetch Library Quizzes (Multi-Filtering + Backend Integration) ──
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoadingLibrary(true);
        
        // Map ordering parameter
        let orderingParam = "-created_at";
        if (currentSort === "Oldest") orderingParam = "created_at";
        else if (currentSort === "Most Popular") orderingParam = "-attempts_count";
        else if (currentSort === "Difficulty: Easy") orderingParam = "difficulty";
        else if (currentSort === "Difficulty: Hard") orderingParam = "-difficulty";

        // Map quiz_mode parameter
        let modeParam = undefined;
        if (appliedFilters.quizMode && appliedFilters.quizMode !== "All Modes") {
          modeParam = appliedFilters.quizMode.toUpperCase();
        }

        // Map difficulty parameter
        let diffParam = undefined;
        if (appliedFilters.difficulty && appliedFilters.difficulty !== "All Difficulty") {
          diffParam = appliedFilters.difficulty;
        }

        const isCreatedByMe = scopeTab === "my_quizzes" || !!appliedFilters.createdByMe;

        const params = {
          search: debouncedSearchQuery.trim() || undefined,
          q: debouncedSearchQuery.trim() || undefined,
          subject: appliedFilters.subject !== "All Subjects" ? appliedFilters.subject : undefined,
          category: activeCategory !== "all" ? activeCategory : undefined,
          difficulty: diffParam,
          quiz_mode: modeParam,
          created_by_me: isCreatedByMe ? true : undefined,
          ordering: orderingParam,
          page: currentPage,
        };

        const res = await libraryService.getLibraryQuizzes(params);
        let rawList = [];
        let calcPages = 1;

        if (res && res.results) {
          rawList = res.results.map(mapQuizData);
          calcPages = Math.ceil(res.count / 8) || 1;
        } else if (Array.isArray(res)) {
          rawList = res.map(mapQuizData);
          calcPages = 1;
        }

        // Apply User Progress Status Filter ("Not Started", "In Progress", "Completed")
        if (appliedFilters.status && appliedFilters.status !== "All Status") {
          const s = appliedFilters.status.toLowerCase();
          rawList = rawList.filter((q) => {
            const prog = Number(q.progress) || 0;
            if (s.includes("completed")) {
              return prog === 100 || q.is_completed === true;
            }
            if (s.includes("in progress")) {
              return prog > 0 && prog < 100 && !q.is_completed;
            }
            if (s.includes("not started")) {
              return prog === 0 && !q.is_completed;
            }
            return true;
          });
        }

        setAllQuizzes(rawList);
        setTotalPages(calcPages);
      } catch (err) {
        console.error("Error fetching library quizzes:", err);
        setAllQuizzes([]);
      } finally {
        setLoadingLibrary(false);
      }
    };
    fetchQuizzes();
  }, [scopeTab, debouncedSearchQuery, activeCategory, appliedFilters, currentSort, currentPage]);

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
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold font-space-grotesk text-app mb-1">
              Library
            </h1>
            <p className="text-sm text-app-muted flex items-center gap-1.5">
              {metaMessage || `Explore ${allQuizzes.length}+ quizzes across categories`}
              <Sparkles size={14} className="text-amber-400" />
            </p>
          </div>

          {/* Quick Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search quizzes by title or subject..."
              className="w-full h-10 pl-10 pr-4 text-xs surface-subtle border border-app rounded-xl text-app placeholder:text-app-muted outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </motion.div>

        {/* Scope Switcher Tabs */}
        <div className="flex items-center gap-3 border-b border-app pb-4">
          <button
            onClick={() => {
              setScopeTab("all");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              scopeTab === "all"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                : "surface-subtle text-app-2 border border-app hover:border-violet-400 hover:text-violet-600"
            }`}
          >
            <Globe size={15} />
            All Public Quizzes
          </button>
          <button
            onClick={() => {
              setScopeTab("my_quizzes");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              scopeTab === "my_quizzes"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                : "surface-subtle text-app-2 border border-app hover:border-violet-400 hover:text-violet-600"
            }`}
          >
            <UserCheck size={15} />
            My Created Quizzes
          </button>
        </div>

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

        {/* Active Filters Bar / Reset Button if filters active */}
        {(appliedFilters.subject !== "All Subjects" || appliedFilters.difficulty !== "All Difficulty" || (appliedFilters.quizMode && appliedFilters.quizMode !== "All Modes") || appliedFilters.createdByMe || appliedFilters.status !== "All Status" || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap text-xs text-app-2 bg-violet-500/10 border border-violet-500/20 p-3 rounded-xl">
            <span className="font-semibold text-violet-600 dark:text-violet-400">Active Filters:</span>
            {searchQuery && (
              <span className="surface px-2.5 py-1 rounded-lg border border-app">Query: "{searchQuery}"</span>
            )}
            {appliedFilters.subject !== "All Subjects" && (
              <span className="surface px-2.5 py-1 rounded-lg border border-app">Subject: {appliedFilters.subject}</span>
            )}
            {appliedFilters.difficulty !== "All Difficulty" && (
              <span className="surface px-2.5 py-1 rounded-lg border border-app">Difficulty: {appliedFilters.difficulty}</span>
            )}
            {appliedFilters.quizMode && appliedFilters.quizMode !== "All Modes" && (
              <span className="surface px-2.5 py-1 rounded-lg border border-app">Mode: {appliedFilters.quizMode}</span>
            )}
            {appliedFilters.createdByMe && (
              <span className="surface px-2.5 py-1 rounded-lg border border-app font-semibold text-violet-600 dark:text-violet-400">My Quizzes Only</span>
            )}
            {appliedFilters.status !== "All Status" && (
              <span className="surface px-2.5 py-1 rounded-lg border border-app">Status: {appliedFilters.status}</span>
            )}
            <button
              onClick={handleClearSidebarFilters}
              className="ml-auto inline-flex items-center gap-1 font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              <RotateCcw size={12} /> Clear All Filters
            </button>
          </div>
        )}

        {/* All Quizzes Grid / Empty State */}
        {scopeTab === "my_quizzes" && !loadingLibrary && allQuizzes.length === 0 ? (
          <div className="surface rounded-3xl p-10 md:p-14 border border-app text-center max-w-xl mx-auto space-y-5 my-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto border border-violet-500/20">
              <Sparkles size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-space-grotesk text-app mb-2">
                You haven't created any quizzes yet!
              </h3>
              <p className="text-sm text-app-muted leading-relaxed">
                Generate an instant AI quiz or build custom assessments to build your personal quiz collection.
              </p>
            </div>
            <Link
              to="/generate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
            >
              <PlusCircle size={18} />
              Create New Quiz
            </Link>
          </div>
        ) : (
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
              onSortChange={(sort) => {
                setCurrentSort(sort);
                setCurrentPage(1);
              }}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onOpenFilters={() => setIsFilterDrawerOpen(true)}
            />
          </motion.div>
        )}
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
        quizModeOptions={quizModeOptions}
        statusOptions={statusOptions}
      />
    </div>
  );
};

export default LibraryPage;
