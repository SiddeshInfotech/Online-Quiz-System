import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileQuestion,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Trash,
  CheckCircle2,
  Calendar,
  HelpCircle,
} from "lucide-react";
import customAdminService from "../../services/customAdminService";
import AdminConfirmModal from "../../components/admin/AdminConfirmModal";

const ITEMS_PER_PAGE = 10;

const DEFAULT_QUESTION = () => ({
  question_text: "",
  options: ["", "", "", ""],
  correct_answer: "",
});

const DEFAULT_FORM_STATE = {
  title: "",
  subject: "Java",
  difficulty: "Easy",
  description: "",
  time_limit: 30,
  max_attempts: 2,
  is_published: true,
  questions: [DEFAULT_QUESTION()],
};

const Toast = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isSuccess = toast.type === "success";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-5 duration-200">
      {isSuccess ? (
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle size={18} className="text-red-400 shrink-0" />
      )}
      <span>{toast.message}</span>
      <button
        onClick={onDismiss}
        className="p-1 text-slate-400 hover:text-slate-200 transition-colors ml-2"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const AdminQuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null); // quiz object
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toggle Visibility Loading State
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  // Create / Edit Quiz Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [quizForm, setQuizForm] = useState(DEFAULT_FORM_STATE);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorStatus(null);
      const res = await customAdminService.getQuizzes();
      const list = Array.isArray(res) ? res : res?.results ?? res?.quizzes ?? res?.data ?? [];
      setQuizzes(list);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      const status = err?.response?.status;
      setErrorStatus(status);

      let msg = "Failed to fetch quiz list.";
      if (status === 403) {
        msg = "You don't have permission to perform this action.";
      } else if (status === 404) {
        msg = "Quiz endpoint not found.";
      } else if (status === 500) {
        msg = "Internal server error occurred on backend server.";
      } else if (err?.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }

      setError(msg);
      showToast(msg, "error");
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
        (qz.subject || qz.category || "").toLowerCase().includes(q) ||
        (qz.difficulty || "").toLowerCase().includes(q)
    );
  }, [quizzes, searchQuery]);

  // Paginated Quizzes
  const totalPages = Math.ceil(filteredQuizzes.length / ITEMS_PER_PAGE) || 1;
  const paginatedQuizzes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuizzes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuizzes, currentPage]);

  // Handle Delete Quiz
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await customAdminService.deleteQuiz(deleteTarget.id);
      
      // Remove from UI immediately
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      showToast("Quiz deleted successfully!", "success");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      const status = err?.response?.status;
      let msg = "Failed to delete quiz.";
      if (status === 403) msg = "You don't have permission to perform this action.";
      else if (status === 404) msg = "Quiz not found.";
      else if (err?.response?.data?.detail) msg = err.response.data.detail;
      
      showToast(msg, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle Visibility (Public / Hidden)
  const handleToggleVisibility = async (quiz) => {
    const isCurrentlyPublic =
      quiz.visibility === "Public" ||
      (quiz.visibility === undefined && quiz.is_published !== false && quiz.is_visible !== false);
    const nextPublicState = !isCurrentlyPublic;
    const nextVisibilityString = nextPublicState ? "Public" : "Hidden";
    setToggleLoadingId(quiz.id);

    try {
      await customAdminService.toggleVisibility(quiz.id, nextPublicState);
      
      // Update row immediately without full reload
      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === quiz.id
            ? {
                ...q,
                is_published: nextPublicState,
                is_visible: nextPublicState,
                visibility: nextVisibilityString,
              }
            : q
        )
      );
      showToast(
        `Quiz "${quiz.title || quiz.quiz_title}" set to ${nextVisibilityString}.`,
        "success"
      );
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      const status = err?.response?.status;
      let msg = "Failed to update visibility.";
      if (status === 403) msg = "You don't have permission to perform this action.";
      else if (status === 404) msg = "Quiz not found.";
      else if (err?.response?.data?.detail) msg = err.response.data.detail;
      
      showToast(msg, "error");
    } finally {
      setToggleLoadingId(null);
    }
  };

  // Open Create or Edit Modal
  const openFormModal = (mode, quiz = null) => {
    setModalMode(mode);
    setFormError(null);
    if (mode === "edit" && quiz) {
      setActiveQuizId(quiz.id);
      
      // Extract existing questions if available
      const rawQuestions = quiz.questions ?? quiz.question_list ?? [];
      const formattedQuestions = Array.isArray(rawQuestions) && rawQuestions.length > 0
        ? rawQuestions.map((q) => ({
            question_text: q.question_text || q.text || q.prompt || "",
            options: Array.isArray(q.options)
              ? [...q.options, "", "", "", ""].slice(0, 4)
              : [q.option1 || "", q.option2 || "", q.option3 || "", q.option4 || ""],
            correct_answer: q.correct_answer || q.answer || "",
          }))
        : [DEFAULT_QUESTION()];

      const isQuizPublic =
        quiz.visibility === "Public" ||
        (quiz.visibility === undefined && quiz.is_published !== false && quiz.is_visible !== false);

      setQuizForm({
        title: quiz.title || quiz.quiz_title || "",
        subject: quiz.subject || quiz.category || "Java",
        difficulty: quiz.difficulty || "Easy",
        description: quiz.description || "",
        time_limit: quiz.time_limit || quiz.duration || 30,
        max_attempts: quiz.max_attempts || 2,
        is_published: isQuizPublic,
        questions: formattedQuestions,
      });
    } else {
      setActiveQuizId(null);
      setQuizForm(DEFAULT_FORM_STATE);
    }
  };

  // Question Form Helpers
  const handleAddQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, DEFAULT_QUESTION()],
    }));
  };

  const handleRemoveQuestion = (index) => {
    if (quizForm.questions.length <= 1) {
      showToast("Quiz must contain at least one question.", "error");
      return;
    }
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setQuizForm((prev) => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setQuizForm((prev) => {
      const updated = [...prev.questions];
      const newOptions = [...updated[qIndex].options];
      newOptions[optIndex] = value;

      // If correct_answer was option being edited, update it too
      let newCorrect = updated[qIndex].correct_answer;
      if (newCorrect === updated[qIndex].options[optIndex]) {
        newCorrect = value;
      }

      updated[qIndex] = {
        ...updated[qIndex],
        options: newOptions,
        correct_answer: newCorrect,
      };
      return { ...prev, questions: updated };
    });
  };

  // Save Quiz (Create / Edit)
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!quizForm.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!quizForm.subject.trim()) {
      setFormError("Subject is required.");
      return;
    }

    // Validate Questions
    for (let i = 0; i < quizForm.questions.length; i++) {
      const q = quizForm.questions[i];
      if (!q.question_text.trim()) {
        setFormError(`Question #${i + 1} text is required.`);
        return;
      }
      const filledOptions = q.options.filter((o) => o.trim() !== "");
      if (filledOptions.length < 2) {
        setFormError(`Question #${i + 1} must have at least 2 options.`);
        return;
      }
      if (!q.correct_answer.trim()) {
        setFormError(`Please select the correct answer for Question #${i + 1}.`);
        return;
      }
    }

    try {
      setFormLoading(true);
      
      const payload = {
        title: quizForm.title.trim(),
        subject: quizForm.subject.trim(),
        difficulty: quizForm.difficulty,
        description: quizForm.description.trim(),
        time_limit: Number(quizForm.time_limit),
        max_attempts: Number(quizForm.max_attempts),
        is_published: quizForm.is_published,
        is_visible: quizForm.is_published,
        questions: quizForm.questions.map((q) => ({
          question_text: q.question_text.trim(),
          options: q.options.filter((o) => o.trim() !== ""),
          correct_answer: q.correct_answer.trim(),
        })),
      };

      if (modalMode === "create") {
        await customAdminService.createQuiz(payload);
        showToast("Quiz created successfully!", "success");
      } else if (modalMode === "edit" && activeQuizId) {
        await customAdminService.updateQuiz(activeQuizId, payload);
        showToast("Quiz updated successfully!", "success");
      }

      setModalMode(null);
      fetchQuizzes(); // Refresh quiz list
    } catch (err) {
      console.error("Failed to save quiz:", err);
      const status = err?.response?.status;
      let msg = "Failed to save quiz.";
      
      if (status === 400) {
        const data = err?.response?.data;
        if (typeof data === "object" && data !== null) {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const firstKey = keys[0];
            const val = data[firstKey];
            msg = Array.isArray(val) ? `${firstKey}: ${val.join(", ")}` : String(val);
          }
        } else {
          msg = "Validation error occurred. Check form fields.";
        }
      } else if (status === 403) {
        msg = "You don't have permission to perform this action.";
      } else if (status === 404) {
        msg = "Quiz not found.";
      } else if (err?.response?.data?.detail) {
        msg = err.response.data.detail;
      }

      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (rawDate) => {
    if (!rawDate) return "N/A";
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return String(rawDate);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(rawDate);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-inter pb-12">
      {/* Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Delete Quiz Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Quiz?"
        message={`Are you sure you want to delete quiz "${deleteTarget?.title || deleteTarget?.quiz_title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Create / Edit Quiz Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setModalMode(null)}
          />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50 shrink-0">
              <h3 className="text-lg font-bold font-space-grotesk flex items-center gap-2">
                <Sparkles className="text-violet-400" size={20} />
                {modalMode === "create" ? "Create New Admin Quiz" : "Edit Quiz Details"}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveQuiz} className="overflow-y-auto p-6 space-y-6 text-xs flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quiz Title *</label>
                  <input
                    type="text"
                    required
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    placeholder="e.g. Java Basics"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={quizForm.subject}
                    onChange={(e) => setQuizForm({ ...quizForm, subject: e.target.value })}
                    placeholder="e.g. Java"
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
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                    <label className="block text-slate-300 font-semibold mb-1">Max Attempts</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quizForm.max_attempts}
                      onChange={(e) => setQuizForm({ ...quizForm, max_attempts: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  placeholder="e.g. Introduction to Java concepts and JVM syntax..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={quizForm.is_published}
                  onChange={(e) => setQuizForm({ ...quizForm, is_published: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="is_published" className="text-slate-300 font-semibold cursor-pointer">
                  Visibility: Public (Visible to students)
                </label>
              </div>

              {/* Questions Section */}
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-space-grotesk">
                    <HelpCircle size={16} className="text-violet-400" />
                    Quiz Questions ({quizForm.questions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex items-center gap-1 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Plus size={14} /> Add Question
                  </button>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                  {quizForm.questions.map((q, qIndex) => (
                    <div
                      key={qIndex}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-violet-400">
                          Question #{qIndex + 1}
                        </span>
                        {quizForm.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIndex)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remove question"
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        value={q.question_text}
                        onChange={(e) => handleQuestionChange(qIndex, "question_text", e.target.value)}
                        placeholder="Enter question prompt..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                      />

                      {/* Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 w-4">
                              {String.fromCharCode(65 + optIndex)}:
                            </span>
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Correct Answer Selection */}
                      <div className="pt-2 flex items-center gap-2">
                        <label className="text-slate-400 text-[11px] font-semibold shrink-0">
                          Correct Answer:
                        </label>
                        <select
                          value={q.correct_answer}
                          onChange={(e) => handleQuestionChange(qIndex, "correct_answer", e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-violet-500 cursor-pointer flex-1"
                        >
                          <option value="">-- Select Correct Option --</option>
                          {q.options
                            .filter((opt) => opt.trim() !== "")
                            .map((opt, idx) => (
                              <option key={idx} value={opt}>
                                Option {String.fromCharCode(65 + idx)}: {opt}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 shrink-0">
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
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/20 disabled:opacity-50"
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
            Create, edit, toggle visibility, or delete quizzes across all subject categories.
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

      {/* Server Error Alert with Retry Option */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">
                {errorStatus === 403
                  ? "Permission Error (403)"
                  : errorStatus === 404
                  ? "Endpoint Not Found (404)"
                  : errorStatus === 500
                  ? "Server Error (500)"
                  : "API Error"}
              </p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchQuizzes}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 text-xs font-semibold rounded-xl transition-all shrink-0"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Retry
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by title, subject, or difficulty..."
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
                <th className="px-6 py-4">Title & Subject</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Questions</th>
                <th className="px-6 py-4">Visibility</th>
                <th className="px-6 py-4">Created Date</th>
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
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-7 w-24 bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedQuizzes.length > 0 ? (
                paginatedQuizzes.map((quiz) => {
                  const questionCount =
                    quiz.question_count ??
                    quiz.total_questions ??
                    quiz.num_questions ??
                    quiz.number_of_questions ??
                    quiz.questions?.length ??
                    0;

                  const visibility =
                    quiz.visibility ??
                    (quiz.is_published !== false && quiz.is_visible !== false ? "Public" : "Hidden");

                  const isPublic =
                    visibility === "Public" ||
                    (quiz.visibility === undefined && quiz.is_published !== false && quiz.is_visible !== false);

                  const createdDate = formatDate(quiz.created_at || quiz.created_date || quiz.date);
                  const isToggleLoading = toggleLoadingId === quiz.id;

                  return (
                    <tr key={quiz.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Title & Subject */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-2">
                            {quiz.title || quiz.quiz_title || "Untitled Quiz"}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {quiz.subject || quiz.category || "General"}
                          </div>
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium px-2.5 py-1 rounded-full border text-[11px] ${
                            (quiz.difficulty || "").toLowerCase() === "easy" ||
                            (quiz.difficulty || "").toLowerCase() === "beginner"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : (quiz.difficulty || "").toLowerCase() === "hard" ||
                                (quiz.difficulty || "").toLowerCase() === "advanced"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {quiz.difficulty || "Medium"}
                        </span>
                      </td>

                      {/* Total Questions */}
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {questionCount} {questionCount === 1 ? "Question" : "Questions"}
                      </td>

                      {/* Visibility Toggle Button */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleVisibility(quiz)}
                          disabled={isToggleLoading}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-all disabled:opacity-50 ${
                            isPublic
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                          }`}
                          title={`Click to set ${isPublic ? "Hidden" : "Public"}`}
                        >
                          {isToggleLoading ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : isPublic ? (
                            <>
                              <Eye size={13} /> <span>👁 Public</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={13} /> <span>🙈 Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-500 shrink-0" />
                          <span>{createdDate}</span>
                        </div>
                      </td>

                      {/* Actions */}
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
                            onClick={() => setDeleteTarget(quiz)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            title="Delete quiz"
                          >
                            <Trash2 size={14} />
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
