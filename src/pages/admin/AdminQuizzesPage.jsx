import { useState, useEffect, useMemo } from "react";
import {
  FileQuestion,
  Search,
  Plus,
  Edit2,
  Archive,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import adminService from "../../services/adminService";
import AdminConfirmModal from "../../components/admin/AdminConfirmModal";

const ITEMS_PER_PAGE = 10;

const AdminQuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Archive Confirmation Modal State
  const [archiveTarget, setArchiveTarget] = useState(null); // quiz object
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Create / Edit Quiz Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: "",
    category: "General",
    difficulty: "Medium",
    time_limit: 15,
    num_questions: 10,
    description: "",
    is_published: true,
  });

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getQuizzes();
      const list = Array.isArray(data) ? data : data?.results ?? data?.quizzes ?? [];
      setQuizzes(list);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to fetch quizzes.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Filtered Quizzes
  const filteredQuizzes = useMemo(() => {
    if (!searchQuery.trim()) return quizzes;
    const q = searchQuery.toLowerCase();
    return quizzes.filter(
      (qz) =>
        (qz.title || qz.quiz_title || "").toLowerCase().includes(q) ||
        (qz.category || qz.subject || "").toLowerCase().includes(q) ||
        (qz.difficulty || "").toLowerCase().includes(q)
    );
  }, [quizzes, searchQuery]);

  // Paginated Quizzes
  const totalPages = Math.ceil(filteredQuizzes.length / ITEMS_PER_PAGE) || 1;
  const paginatedQuizzes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuizzes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuizzes, currentPage]);

  // Handle Archive (Backend deletion operation)
  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      setArchiveLoading(true);
      await adminService.archiveQuiz(archiveTarget.id);
      
      // Update local state to mark as archived or remove from active list
      setQuizzes((prev) =>
        prev.map((qz) =>
          qz.id === archiveTarget.id
            ? { ...qz, is_archived: true, status: "archived", is_published: false }
            : qz
        )
      );
      setArchiveTarget(null);
    } catch (err) {
      console.error("Failed to archive quiz:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to archive quiz.";
      setError(msg);
    } finally {
      setArchiveLoading(false);
    }
  };

  // Toggle Publish / Draft
  const handleTogglePublish = async (quiz) => {
    const newStatus = !quiz.is_published;
    try {
      await adminService.toggleQuizStatus(quiz.id, newStatus);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? { ...q, is_published: newStatus } : q))
      );
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to update quiz publish status.";
      setError(msg);
    }
  };

  // Open Modal for Create or Edit
  const openFormModal = (mode, quiz = null) => {
    setModalMode(mode);
    setActiveQuiz(quiz);
    if (mode === "edit" && quiz) {
      setQuizForm({
        title: quiz.title || quiz.quiz_title || "",
        category: quiz.category || quiz.subject || "General",
        difficulty: quiz.difficulty || "Medium",
        time_limit: quiz.time_limit || quiz.duration || 15,
        num_questions: quiz.num_questions || quiz.number_of_questions || 10,
        description: quiz.description || "",
        is_published: quiz.is_published !== false,
      });
    } else {
      setQuizForm({
        title: "",
        category: "General",
        difficulty: "Medium",
        time_limit: 15,
        num_questions: 10,
        description: "",
        is_published: true,
      });
    }
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!quizForm.title.trim()) return;

    try {
      setFormLoading(true);
      if (modalMode === "create") {
        const created = await adminService.createQuiz(quizForm);
        setQuizzes((prev) => [created, ...prev]);
      } else if (modalMode === "edit" && activeQuiz) {
        const updated = await adminService.updateQuiz(activeQuiz.id, quizForm);
        setQuizzes((prev) =>
          prev.map((q) => (q.id === activeQuiz.id ? { ...q, ...updated } : q))
        );
      }
      setModalMode(null);
    } catch (err) {
      console.error("Failed to save quiz:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to save quiz.";
      setError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-inter">
      {/* Archive Quiz Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(archiveTarget)}
        title="Archive Quiz"
        message={`Are you sure you want to archive quiz "${archiveTarget?.title || archiveTarget?.quiz_title}"? Archived quizzes are hidden from students.`}
        confirmText="Archive Quiz"
        variant="warning"
        isLoading={archiveLoading}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      {/* Create / Edit Quiz Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setModalMode(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold font-space-grotesk flex items-center gap-2">
                <Sparkles className="text-violet-400" size={20} />
                {modalMode === "create" ? "Create New Admin Quiz" : "Edit Quiz Details"}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="e.g. Data Structures & Algorithms Fundamentals"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={quizForm.category}
                    onChange={(e) => setQuizForm({ ...quizForm, category: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
                  <select
                    value={quizForm.difficulty}
                    onChange={(e) => setQuizForm({ ...quizForm, difficulty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Medium">Medium</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Limit (mins)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quizForm.time_limit}
                    onChange={(e) => setQuizForm({ ...quizForm, time_limit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Question Count</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quizForm.num_questions}
                    onChange={(e) => setQuizForm({ ...quizForm, num_questions: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  placeholder="Optional brief overview of this quiz..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={quizForm.is_published}
                  onChange={(e) => setQuizForm({ ...quizForm, is_published: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="is_published" className="text-slate-300 font-semibold cursor-pointer">
                  Publish immediately (Visible to students)
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold flex items-center gap-2"
                >
                  {formLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {modalMode === "create" ? "Create Quiz" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-space-grotesk text-slate-100 flex items-center gap-2">
            📝 Quiz Moderation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, edit, toggle publish status, or archive quizzes across all categories.
          </p>
        </div>

        <button
          onClick={() => openFormModal("create")}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-violet-600/25 transition-all"
        >
          <Plus size={16} />
          <span>Create New Quiz</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Operation Error</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by title, category, or difficulty..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total: <span className="text-slate-100 font-bold">{filteredQuizzes.length}</span> quizzes
        </div>
      </div>

      {/* Quiz Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-semibold text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Title & Category</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Questions</th>
                <th className="px-6 py-4">Time Limit</th>
                <th className="px-6 py-4">Publish Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-7 w-24 bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedQuizzes.length > 0 ? (
                paginatedQuizzes.map((quiz) => {
                  const isArchived = quiz.is_archived === true || quiz.status === "archived";
                  const isPublished = quiz.is_published !== false && !isArchived;

                  return (
                    <tr key={quiz.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-2">
                            {quiz.title || quiz.quiz_title || "Untitled Quiz"}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {quiz.category || quiz.subject || "General"}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-medium px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                          {quiz.difficulty || "Medium"}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {quiz.num_questions ?? quiz.number_of_questions ?? 10} Qs
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {quiz.time_limit ?? quiz.duration ?? 15}m
                      </td>

                      <td className="px-6 py-4">
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Archived
                          </span>
                        ) : isPublished ? (
                          <button
                            onClick={() => handleTogglePublish(quiz)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer transition-all"
                          >
                            <Check size={12} /> Published
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTogglePublish(quiz)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer transition-all"
                          >
                            Draft
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openFormModal("edit", quiz)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Edit quiz"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => setArchiveTarget(quiz)}
                            disabled={isArchived}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-40 transition-colors"
                            title={isArchived ? "Quiz is already archived" : "Archive quiz"}
                          >
                            <Archive size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <FileQuestion size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-slate-400">No quizzes found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuizzesPage;
