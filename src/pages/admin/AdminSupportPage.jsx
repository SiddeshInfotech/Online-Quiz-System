import { useState, useEffect, useMemo } from "react";
import {
  Inbox,
  Search,
  CheckCircle2,
  Clock,
  Mail,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import adminService from "../../services/adminService";

const ITEMS_PER_PAGE = 10;

const AdminSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Ticket Drawer Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getSupportTickets();
      const list = Array.isArray(data) ? data : data?.results ?? data?.tickets ?? [];
      setTickets(list);
    } catch (err) {
      console.error("Failed to load support tickets:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to fetch support tickets inbox.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const sender = (t.sender || t.name || t.username || "").toLowerCase();
      const email = (t.email || "").toLowerCase();
      const subject = (t.subject || "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = !q || sender.includes(q) || email.includes(q) || subject.includes(q);
      if (!matchesSearch) return false;

      const isResolved = (t.status || "").toLowerCase() === "resolved";
      if (statusFilter === "Pending") return !isResolved;
      if (statusFilter === "Resolved") return isResolved;

      return true;
    });
  }, [tickets, searchQuery, statusFilter]);

  // Paginated Tickets
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  const handleToggleStatus = async (ticket) => {
    const currentStatus = (ticket.status || "pending").toLowerCase();
    const newStatus = currentStatus === "resolved" ? "pending" : "resolved";

    try {
      setUpdatingId(ticket.id);
      await adminService.updateSupportTicket(ticket.id, newStatus);
      
      // Update state locally
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t))
      );

      if (selectedTicket && selectedTicket.id === ticket.id) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error("Failed to update ticket status:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to update support ticket status.";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-inter">
      {/* Detail Drawer Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100 font-space-grotesk">
                    {selectedTicket.subject || "Support Inquiry"}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Category: {selectedTicket.category || "General"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>From: <strong className="text-slate-100">{selectedTicket.sender || selectedTicket.name || "Student"}</strong></span>
                  <span className="text-slate-500">{formatDate(selectedTicket.created_at || selectedTicket.date)}</span>
                </div>
                <div className="text-slate-400">{selectedTicket.email}</div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Message Body
                </label>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedTicket.message || selectedTicket.body || "No message content."}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  onClick={() => handleToggleStatus(selectedTicket)}
                  disabled={updatingId === selectedTicket.id}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    (selectedTicket.status || "").toLowerCase() === "resolved"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                  }`}
                >
                  {(selectedTicket.status || "").toLowerCase() === "resolved" ? (
                    <>Mark as Pending</>
                  ) : (
                    <>Mark as Resolved</>
                  )}
                </button>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-space-grotesk text-slate-100 flex items-center gap-2">
            💬 Support Inbox
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review user feedback, help inquiries, and toggle ticket resolution states.
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

      {/* Controls Bar: Search & Status Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by sender, email, or subject..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="All">All Ticket Statuses</option>
            <option value="Pending">Pending Only</option>
            <option value="Resolved">Resolved Only</option>
          </select>
        </div>
      </div>

      {/* Ticket Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-semibold text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Sender & Email</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-7 w-28 bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedTickets.length > 0 ? (
                paginatedTickets.map((ticket) => {
                  const isResolved = (ticket.status || "").toLowerCase() === "resolved";
                  const sender = ticket.sender || ticket.name || ticket.username || "Student";
                  const email = ticket.email || "—";
                  const category = ticket.category || "General";
                  const subject = ticket.subject || "Support inquiry";
                  const date = formatDate(ticket.created_at || ticket.date);

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-100">{sender}</div>
                          <div className="text-[11px] text-slate-400">{email}</div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-300">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px]">
                          {category}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-200 max-w-xs truncate" title={subject}>
                        {subject}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {date}
                      </td>

                      <td className="px-6 py-4">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl font-medium transition-colors text-[11px]"
                          >
                            View Message
                          </button>

                          <button
                            onClick={() => handleToggleStatus(ticket)}
                            disabled={updatingId === ticket.id}
                            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer text-[11px] disabled:opacity-50 ${
                              isResolved
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            {isResolved ? "Set Pending" : "Set Resolved"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Inbox size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-slate-400">No support tickets found</p>
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

export default AdminSupportPage;
