import { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
} from "lucide-react";
import adminService from "../../services/adminService";

const ITEMS_PER_PAGE = 10;

const AdminPenaltiesPage = () => {
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filter, Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPenalties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPenalties();
      const list = Array.isArray(data) ? data : data?.results ?? data?.penalties ?? [];
      setPenalties(list);
    } catch (err) {
      console.error("Failed to load penalties:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to fetch anti-cheating penalty logs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenalties();
  }, []);

  // Filtered Penalties
  const filteredPenalties = useMemo(() => {
    return penalties.filter((p) => {
      const studentName = (p.student || p.user_name || p.username || p.full_name || "").toLowerCase();
      const email = (p.email || p.user_email || "").toLowerCase();
      const quizTitle = (p.quiz || p.quiz_title || "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        !q || studentName.includes(q) || email.includes(q) || quizTitle.includes(q);

      if (!matchesSearch) return false;

      if (severityFilter === "High") return (p.penalty ?? p.penalty_points ?? 0) >= 50;
      if (severityFilter === "Medium") {
        const pts = p.penalty ?? p.penalty_points ?? 0;
        return pts >= 20 && pts < 50;
      }
      if (severityFilter === "Low") return (p.penalty ?? p.penalty_points ?? 0) < 20;

      return true;
    });
  }, [penalties, searchQuery, severityFilter]);

  // Paginated Penalties
  const totalPages = Math.ceil(filteredPenalties.length / ITEMS_PER_PAGE) || 1;
  const paginatedPenalties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPenalties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPenalties, currentPage]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-space-grotesk text-slate-100 flex items-center gap-2">
            🛡️ Anti-Cheating Penalty Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit tab-switch violations, security alerts, and penalty points issued during quiz attempts.
          </p>
        </div>
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

      {/* Controls Bar: Search & Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by student, email, or quiz..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="All">All Severity Levels</option>
            <option value="High">High Severity (≥ 50 pts)</option>
            <option value="Medium">Medium Severity (20–49 pts)</option>
            <option value="Low">Low Severity (&lt; 20 pts)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-semibold text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Quiz Title</th>
                <th className="px-6 py-4">Violations</th>
                <th className="px-6 py-4">Penalty Points</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-36 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-24 bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedPenalties.length > 0 ? (
                paginatedPenalties.map((item, idx) => {
                  const studentName = item.student || item.user_name || item.username || item.full_name || "Student";
                  const email = item.email || item.user_email || "—";
                  const quizTitle = item.quiz || item.quiz_title || "Quiz";
                  const violations = item.violations || item.violation_count || 1;
                  const points = item.penalty ?? item.penalty_points ?? 10;
                  const reason = item.reason || item.violation_type || "Tab switch / full screen violation";
                  const timestamp = formatDate(item.timestamp || item.created_at || item.date);

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      {/* Student Info */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-100">{studentName}</div>
                          <div className="text-[11px] text-slate-400">{email}</div>
                        </div>
                      </td>

                      {/* Quiz Title */}
                      <td className="px-6 py-4 font-medium text-slate-200">
                        {quizTitle}
                      </td>

                      {/* Violations */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-[11px]">
                          {violations} count
                        </span>
                      </td>

                      {/* Penalty Points */}
                      <td className="px-6 py-4 font-bold text-rose-400">
                        -{points} PTS
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={reason}>
                        {reason}
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4 text-right text-slate-400 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} className="text-slate-500" />
                          {timestamp}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ShieldAlert size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-slate-400">No penalty logs found</p>
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

export default AdminPenaltiesPage;
