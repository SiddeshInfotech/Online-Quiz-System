import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Star,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Reply,
  Clock,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Check,
} from "lucide-react";
import adminFeedbackService from "../../services/adminFeedbackService";
import AdminConfirmModal from "../../components/admin/AdminConfirmModal";
import { resolveMediaUrl } from "../../services/api";

const ITEMS_PER_PAGE = 20;

// Predefined Quick Replies
const PREDEFINED_REPLIES = [
  "Thank you!",
  "We appreciate your feedback.",
  "We're working on this issue.",
  "Issue fixed.",
  "Need more information.",
  "Thank you for your valuable feedback. We appreciate your suggestion and will consider it in future updates.",
];

// Helper: Toast Notification Component
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
        className="p-1 text-slate-400 hover:text-slate-200 transition-colors ml-2 cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// Helper: Star Rating Display Component
const StarDisplay = ({ rating = 0, size = 16, interactive = false, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const currentRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange && onChange(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`${interactive ? "cursor-pointer p-0.5 hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            size={size}
            className={`${
              star <= currentRating
                ? "text-amber-400 fill-amber-400"
                : "text-slate-700 fill-slate-800/40"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const normalized = (status || "Pending").toLowerCase();

  if (normalized === "replied") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 size={12} /> Replied
      </span>
    );
  }
  if (normalized === "reviewed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
        <Check size={12} /> Reviewed
      </span>
    );
  }
  if (normalized === "hidden") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
        <EyeOff size={12} /> Hidden
      </span>
    );
  }
  // Pending default (yellow/amber)
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
      <Clock size={12} /> Pending
    </span>
  );
};

const AdminFeedbackPage = () => {
  // Feedback List & Pagination State
  const [feedbacks, setFeedbacks] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState({ count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Statistics State
  const [statsData, setStatsData] = useState({
    total_feedback: 0,
    pending: 0,
    reviewed: 0,
    replied: 0,
    hidden: 0,
    average_rating: 0,
    five_star_count: 0,
  });

  // Filters & Search & Ordering
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer Detail State
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Edit Modal State
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editStatus, setEditStatus] = useState("Pending");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notifications
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // Section 12: Backend Error Handling Helper
  const handleApiError = useCallback((err, fallbackMsg = "An error occurred.") => {
    let msg = fallbackMsg;
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data === "string") {
        msg = data;
      } else if (data.detail) {
        msg = data.detail;
      } else if (data.reply_message) {
        msg = Array.isArray(data.reply_message) ? data.reply_message.join(" ") : data.reply_message;
      } else if (data.message) {
        msg = data.message;
      } else if (data.error) {
        msg = data.error;
      } else {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          msg = `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey].join(" ") : data[firstKey]}`;
        }
      }
    } else if (err.response?.status === 403) {
      msg = "Permission denied.";
    } else if (err.response?.status === 404) {
      msg = "Feedback not found.";
    } else if (err.response?.status === 500) {
      msg = "Server error. Please try again later.";
    }
    showToast(msg, "error");
  }, [showToast]);

  // Section 3: Debounce Search Query by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Map Sorting Dropdown to Backend Ordering Parameters
  const getOrderingQuery = (sortKey) => {
    switch (sortKey) {
      case "newest":
        return "-created_at";
      case "oldest":
        return "created_at";
      case "rating_high":
        return "-rating";
      case "rating_low":
        return "rating";
      case "status":
        return "-status";
      default:
        return "-created_at";
    }
  };

  // Section 1: Fetch Dashboard Statistics (GET /api/admin/feedback/stats/)
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await adminFeedbackService.getStats();
      if (data) {
        setStatsData({
          total_feedback: data.total_feedback ?? data.total ?? data.total_feedbacks ?? 0,
          pending: data.pending ?? 0,
          reviewed: data.reviewed ?? 0,
          replied: data.replied ?? 0,
          hidden: data.hidden ?? 0,
          average_rating: data.average_rating ?? data.avg_rating ?? data.rating ?? 0,
          five_star_count: data.five_star_count ?? data.five_star ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to load feedback stats:", err);
      // Silent stats fail or notify gently
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Section 2 & 4: Fetch Feedback List (GET /api/admin/feedback/)
  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        search: debouncedSearch || undefined,
        rating: ratingFilter !== "All" ? ratingFilter : undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        ordering: getOrderingQuery(sortBy),
      };

      const res = await adminFeedbackService.getFeedbacks(params);
      
      if (res && Array.isArray(res.results)) {
        setFeedbacks(res.results);
        setPaginationInfo({
          count: res.count ?? res.results.length,
          next: res.next,
          previous: res.previous,
        });
      } else if (Array.isArray(res)) {
        setFeedbacks(res);
        setPaginationInfo({ count: res.length, next: null, previous: null });
      } else {
        setFeedbacks([]);
        setPaginationInfo({ count: 0, next: null, previous: null });
      }
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err);
      handleApiError(err, "Failed to load feedbacks.");
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, ratingFilter, statusFilter, sortBy, handleApiError]);

  // Initial load & Refetch on filter / search / page changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Reset to Page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, ratingFilter, statusFilter, sortBy]);

  // Section 5: Fetch Detailed Feedback for Drawer (GET /api/admin/feedback/{id}/)
  const handleOpenDrawer = async (item) => {
    setSelectedFeedback(item);
    setReplyText(item.reply_message || item.admin_reply || "");
    setIsReplying(!item.reply_message && !item.admin_reply);
    setDrawerLoading(true);

    try {
      const detail = await adminFeedbackService.getFeedback(item.id);
      if (detail) {
        setSelectedFeedback(detail);
        setReplyText(detail.reply_message || detail.admin_reply || "");
        setIsReplying(!detail.reply_message && !detail.admin_reply);
      }
    } catch (err) {
      console.error("Failed to load feedback details:", err);
      // Keep initial row item if detail request fails
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedFeedback(null);
    setReplyText("");
    setIsReplying(false);
  };

  // Section 6: Post Reply (POST /api/admin/feedback/{id}/reply/)
  const handleSaveReply = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFeedback) return;
    if (!replyText.trim()) {
      showToast("Reply message cannot be empty.", "error");
      return;
    }

    setIsSubmittingReply(true);
    try {
      await adminFeedbackService.replyFeedback(selectedFeedback.id, {
        reply_message: replyText.trim(),
      });

      showToast("Reply sent successfully.");
      setIsReplying(false);

      // Refresh drawer, list, and statistics
      const updatedDetail = await adminFeedbackService.getFeedback(selectedFeedback.id).catch(() => null);
      if (updatedDetail) {
        setSelectedFeedback(updatedDetail);
      } else {
        setSelectedFeedback((prev) =>
          prev ? { ...prev, reply_message: replyText.trim(), admin_reply: replyText.trim(), status: "Replied" } : null
        );
      }

      fetchFeedbacks();
      fetchStats();
    } catch (err) {
      console.error("Failed to post reply:", err);
      handleApiError(err, "Failed to send reply.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Section 7: Update Feedback (PATCH /api/admin/feedback/{id}/)
  const handleStatusChange = async (item, newStatus) => {
    try {
      await adminFeedbackService.updateFeedback(item.id, { status: newStatus });
      showToast(`Status updated to ${newStatus}.`);

      if (selectedFeedback && selectedFeedback.id === item.id) {
        setSelectedFeedback((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      fetchFeedbacks();
      fetchStats();
    } catch (err) {
      console.error("Status update error:", err);
      handleApiError(err, "Failed to update status.");
    }
  };

  // Section 8: Hide Feedback (POST /api/admin/feedback/{id}/hide/)
  const handleToggleHide = async (item) => {
    try {
      await adminFeedbackService.hideFeedback(item.id);
      showToast("Feedback hidden successfully.");

      const isCurrentlyHidden = (item.status || "").toLowerCase() === "hidden";
      const nextStatus = isCurrentlyHidden ? "Pending" : "Hidden";

      if (selectedFeedback && selectedFeedback.id === item.id) {
        setSelectedFeedback((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }

      fetchFeedbacks();
      fetchStats();
    } catch (err) {
      console.error("Hide error:", err);
      handleApiError(err, "Failed to hide feedback.");
    }
  };

  // Edit Modal Save (PATCH /api/admin/feedback/{id}/)
  const handleOpenEdit = (item) => {
    setEditingFeedback(item);
    setEditMessage(item.message || "");
    setEditRating(item.rating || 5);
    setEditStatus(item.status || "Pending");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingFeedback) return;
    if (!editMessage.trim()) {
      showToast("Feedback message cannot be empty.", "error");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const payload = {
        message: editMessage.trim(),
        rating: editRating,
        status: editStatus,
      };

      await adminFeedbackService.updateFeedback(editingFeedback.id, payload);
      showToast("Feedback updated successfully.");
      setEditingFeedback(null);

      if (selectedFeedback && selectedFeedback.id === editingFeedback.id) {
        setSelectedFeedback((prev) => (prev ? { ...prev, ...payload } : null));
      }

      fetchFeedbacks();
      fetchStats();
    } catch (err) {
      console.error("Edit error:", err);
      handleApiError(err, "Failed to update feedback.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Section 9: Delete Feedback (DELETE /api/admin/feedback/{id}/)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await adminFeedbackService.deleteFeedback(deleteTarget.id);
      showToast("Feedback deleted successfully.");

      if (selectedFeedback && selectedFeedback.id === deleteTarget.id) {
        setSelectedFeedback(null);
      }

      setDeleteTarget(null);
      fetchFeedbacks();
      fetchStats();
    } catch (err) {
      console.error("Delete error:", err);
      handleApiError(err, "Failed to delete feedback.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const totalPages = Math.ceil((paginationInfo.count || 0) / ITEMS_PER_PAGE) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-inter text-slate-100 pb-12">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete User Feedback?"
        message={`Are you sure you want to delete feedback #${deleteTarget?.id} submitted by ${
          deleteTarget?.user_name || deleteTarget?.student_name || deleteTarget?.username || "this user"
        }? This action cannot be undone.`}
        confirmText="Delete Feedback"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Edit Feedback Modal */}
      <AnimatePresence>
        {editingFeedback && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
              onClick={() => setEditingFeedback(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl shadow-violet-950/40 p-6 text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-600/15 text-violet-400 border border-violet-500/25 shrink-0 shadow-sm">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-space-grotesk text-slate-100">Edit Feedback #{editingFeedback.id}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">By {editingFeedback.user_name || editingFeedback.student_name || editingFeedback.username || "User"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingFeedback(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      Rating Stars
                    </label>
                    <span className="text-[11px] font-bold text-amber-400">
                      {editRating} / 5 Stars
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <StarDisplay
                      rating={editRating}
                      size={24}
                      interactive
                      onChange={(r) => setEditRating(r)}
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Click star to change</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                    Feedback Message Text
                  </label>
                  <textarea
                    rows={4}
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
                    placeholder="Feedback content..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[10px]">
                    Status
                  </label>
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 grid grid-cols-4 gap-1">
                    {["Pending", "Reviewed", "Replied", "Hidden"].map((st) => {
                      const isActive = (editStatus || "").toLowerCase() === st.toLowerCase();
                      let activeStyle = "bg-violet-600 text-white shadow-md font-bold border-violet-500";
                      if (st === "Pending") activeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold";
                      if (st === "Reviewed") activeStyle = "bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold";
                      if (st === "Replied") activeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold";
                      if (st === "Hidden") activeStyle = "bg-slate-800 text-slate-200 border-slate-700 font-bold";

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setEditStatus(st)}
                          className={`py-2 px-1 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                            isActive
                              ? activeStyle
                              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditingFeedback(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
                  >
                    {isSubmittingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Moderation Detail Drawer */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={handleCloseDrawer}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-20">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* User Profile Avatar / Initial */}
                  {selectedFeedback.profile_picture ? (
                    <img
                      src={resolveMediaUrl(selectedFeedback.profile_picture || selectedFeedback.user_avatar)}
                      alt="Avatar"
                      className="w-12 h-12 rounded-2xl object-cover border border-violet-500/30 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center font-bold text-base shrink-0 shadow-lg shadow-violet-600/10">
                      {(selectedFeedback.user_name || selectedFeedback.student_name || selectedFeedback.username || "U")[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-base font-space-grotesk text-slate-100 leading-snug truncate">
                        {selectedFeedback.user_name || selectedFeedback.student_name || selectedFeedback.username || "Anonymous User"}
                      </h3>
                      <StatusBadge status={selectedFeedback.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {selectedFeedback.email || "No email"} • <span className="font-mono text-slate-400">#FB-{selectedFeedback.id}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseDrawer}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
                {drawerLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-24 bg-slate-950 rounded-xl border border-slate-800" />
                    <div className="h-28 bg-slate-950 rounded-xl border border-slate-800" />
                    <div className="h-12 bg-slate-950 rounded-xl border border-slate-800" />
                  </div>
                ) : (
                  <>
                    {/* User Information Card (Two-column layout) */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        User Information
                      </label>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium block text-[11px] mb-0.5">Username</span>
                          <strong className="text-slate-200 font-semibold">@{selectedFeedback.username || "N/A"}</strong>
                        </div>

                        <div>
                          <span className="text-slate-500 font-medium block text-[11px] mb-0.5">Submitted Date</span>
                          <span className="text-slate-300 font-medium">{formatDate(selectedFeedback.created_at)}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 font-medium block text-[11px] mb-0.5">Email Address</span>
                          <span className="text-slate-300 font-mono text-[11px] truncate block">{selectedFeedback.email || "N/A"}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 font-medium block text-[11px] mb-0.5">Rating</span>
                          <StarDisplay rating={selectedFeedback.rating} size={15} />
                        </div>
                      </div>
                    </div>

                    {/* Customer Feedback Card */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Customer Feedback
                        </label>
                        <StarDisplay rating={selectedFeedback.rating} size={16} />
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-100 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                        "{selectedFeedback.message}"
                      </div>
                    </div>

                    {/* Status Management Segmented Pill Tabs */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Status Management
                      </label>
                      <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 grid grid-cols-4 gap-1">
                        {["Pending", "Reviewed", "Replied", "Hidden"].map((st) => {
                          const isActive = (selectedFeedback.status || "").toLowerCase() === st.toLowerCase();
                          let activeStyle = "bg-violet-600 text-white shadow-md font-bold border-violet-500";
                          if (st === "Pending") activeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold";
                          if (st === "Reviewed") activeStyle = "bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold";
                          if (st === "Replied") activeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold";
                          if (st === "Hidden") activeStyle = "bg-slate-800 text-slate-200 border-slate-700 font-bold";

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(selectedFeedback, st)}
                              className={`py-2 px-1 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                                isActive
                                  ? activeStyle
                                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="h-px bg-slate-800/80 my-2" />

                    {/* Admin Reply Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Reply size={14} className="text-violet-400" /> Admin Reply
                        </label>

                        <div className="flex items-center gap-2">
                          {(selectedFeedback.reply_message || selectedFeedback.admin_reply) && !isReplying && (
                            <button
                              type="button"
                              onClick={() => setIsReplying(true)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit2 size={12} /> Edit Reply
                            </button>
                          )}

                          {!(selectedFeedback.reply_message || selectedFeedback.admin_reply) && !isReplying && (
                            <button
                              type="button"
                              onClick={() => setIsReplying(true)}
                              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-md cursor-pointer"
                            >
                              <Reply size={12} /> Reply
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reply Confirmation Card */}
                      {(selectedFeedback.reply_message || selectedFeedback.admin_reply) && !isReplying && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                              <CheckCircle2 size={15} /> ✔ Reply Sent
                            </span>
                            <span className="text-[10px] font-medium text-emerald-400/80">
                              {formatDate(selectedFeedback.reply_date || selectedFeedback.replied_at || selectedFeedback.updated_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-normal italic">
                            "{selectedFeedback.reply_message || selectedFeedback.admin_reply}"
                          </p>
                          <div className="text-[10px] text-emerald-400/80 font-semibold pt-1">
                            Replied by {selectedFeedback.replied_by_username || "Admin Staff"}
                          </div>
                        </div>
                      )}

                      {/* Collapsible Reply Editor */}
                      {isReplying && (
                        <form onSubmit={handleSaveReply} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Select Quick Template:
                            </span>
                            <span className="text-[10px] text-violet-400 font-medium">Click chip to insert</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {PREDEFINED_REPLIES.map((tmpl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setReplyText(tmpl)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-violet-600/10 text-slate-300 hover:text-violet-300 text-[11px] font-medium transition-all text-left cursor-pointer"
                              >
                                {tmpl}
                              </button>
                            ))}
                          </div>

                          <div className="relative">
                            <textarea
                              rows={5}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
                              placeholder="Write a professional response..."
                              maxLength={1000}
                            />
                            <div className={`text-right text-[10px] mt-1 font-mono ${replyText.length > 1000 ? 'text-red-400' : 'text-slate-500'}`}>
                              {replyText.length} / 1000
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsReplying(false)}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingReply}
                              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                              <Send size={13} />
                              {isSubmittingReply ? "Saving..." : "Save Reply"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleHide(selectedFeedback)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {(selectedFeedback.status || "").toLowerCase() === "hidden" ? (
                      <>
                        <Eye size={14} className="text-emerald-400" /> Unhide Feedback
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} className="text-amber-400" /> Hide Feedback
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selectedFeedback)}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Feedback
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedFeedback)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 size={14} /> Edit Feedback
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-space-grotesk text-slate-100 flex items-center gap-2.5">
            💬 Feedback Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review user ratings, respond to feedback messages, edit entries, and manage visibility.
          </p>
        </div>

        <button
          onClick={() => { fetchStats(); fetchFeedbacks(); }}
          className="self-start sm:self-auto px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading || statsLoading ? "animate-spin text-violet-400" : ""} />
          Refresh Data
        </button>
      </div>

      {/* Top Statistics Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Stat Card 1: Total Feedback */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare size={48} className="text-violet-400" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Feedback
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-space-grotesk text-slate-100">
              {statsLoading ? "..." : statsData.total_feedback}
            </span>
            <span className="text-[10px] text-violet-400 font-medium">All Time</span>
          </div>
        </div>

        {/* Stat Card 2: Pending */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={48} className="text-amber-400" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Pending
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-space-grotesk text-amber-400">
              {statsLoading ? "..." : statsData.pending}
            </span>
            <span className="text-[10px] text-amber-400/80 font-medium">Needs Review</span>
          </div>
        </div>

        {/* Stat Card 3: Replied */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 size={48} className="text-emerald-400" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Replied
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-space-grotesk text-emerald-400">
              {statsLoading ? "..." : statsData.replied}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-medium">Addressed</span>
          </div>
        </div>

        {/* Stat Card 4: Average Rating */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Star size={48} className="text-amber-400" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Average Rating
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-space-grotesk text-slate-100">
              {statsLoading ? "..." : Number(statsData.average_rating || 0).toFixed(1)}
            </span>
            <Star size={16} className="text-amber-400 fill-amber-400 mb-0.5" />
          </div>
        </div>

        {/* Stat Card 5: 5 Star Count */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group col-span-2 sm:col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={48} className="text-violet-400" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            5 Star Count
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-space-grotesk text-violet-400">
              {statsLoading ? "..." : statsData.five_star_count}
            </span>
            <span className="text-[10px] text-violet-400/80 font-medium">Top Score</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by username, email, or feedback message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Replied">Replied</option>
              <option value="Hidden">Hidden</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Star size={14} className="text-amber-400" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Ordering Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="rating_high">Sort: Highest Rating</option>
              <option value="rating_low">Sort: Lowest Rating</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Feedback Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-semibold text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">ID & User</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Feedback Message</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 bg-slate-800 rounded mb-1" />
                      <div className="h-3 w-24 bg-slate-800/60 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 bg-slate-800 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-48 bg-slate-800 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-slate-800 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-16 bg-slate-800 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-7 w-32 bg-slate-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : feedbacks.length > 0 ? (
                feedbacks.map((item) => {
                  const userName = item.user_name || item.student_name || item.username || item.name || "User";
                  const isHidden = (item.status || "").toLowerCase() === "hidden";
                  const avatarUrl = resolveMediaUrl(item.profile_picture || item.avatar || item.user_avatar);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDrawer(item)}
                    >
                      {/* ID & User */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => handleOpenDrawer(item)}
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={userName}
                              className="w-8 h-8 rounded-full object-cover border border-violet-500/30 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {userName[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {userName}
                              <span className="text-[10px] font-mono text-slate-500">#{item.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{item.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4">
                        <StarDisplay rating={item.rating} size={15} />
                      </td>

                      {/* Message Snippet */}
                      <td className="px-6 py-4 max-w-xs sm:max-w-sm">
                        <p className="text-slate-200 truncate font-normal" title={item.message}>
                          "{item.message}"
                        </p>
                        {(item.reply_message || item.admin_reply) && (
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 truncate">
                            <CheckCircle2 size={10} /> Replied: {item.reply_message || item.admin_reply}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {formatDate(item.created_at)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reply / View Drawer Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(item)}
                            title="Open Feedback Drawer"
                            className="px-2.5 py-1.5 bg-violet-600/10 text-violet-400 hover:bg-violet-600 hover:text-white rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Reply size={12} /> Reply
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Feedback"
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Hide / Unhide Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleHide(item)}
                            title={isHidden ? "Unhide Feedback" : "Hide Feedback"}
                            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                              isHidden
                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            }`}
                          >
                            {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Feedback"
                            className="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <MessageSquare size={36} className="mx-auto mb-3 opacity-40 text-violet-400" />
                    <p className="text-base font-semibold text-slate-300 font-space-grotesk">No feedback found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Try adjusting your search criteria or resetting filters to view user feedback entries.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Backend Pagination Bar (Section 10) */}
        {paginationInfo.count > 0 && (
          <div className="px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              Showing page <strong className="text-slate-200">{currentPage}</strong> of{" "}
              <strong className="text-slate-200">{totalPages}</strong> (
              <strong className="text-slate-200">{paginationInfo.count}</strong> total items)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!paginationInfo.previous || currentPage === 1}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-violet-600 text-white shadow-md"
                          : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={!paginationInfo.next || currentPage >= totalPages}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
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

export default AdminFeedbackPage;
