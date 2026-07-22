import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  CheckCircle,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Shield,
} from "lucide-react";
import adminService from "../../services/adminService";
import { useAdminAuth } from "../../context/AdminAuthContext";
import AdminConfirmModal from "../../components/admin/AdminConfirmModal";

const ITEMS_PER_PAGE = 10;

const AdminUsersPage = () => {
  const { adminUser } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Action Confirmation Modal State
  const [actionTarget, setActionTarget] = useState(null); // { user, action: 'suspend' | 'activate' }
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUsers();
      const list = Array.isArray(data) ? data : data?.results ?? data?.users ?? [];
      setUsers(list);
    } catch (err) {
      console.error("Failed to load users:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to fetch user directory.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Paginated Users
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    const { user, action } = actionTarget;

    try {
      setActionLoading(true);
      if (action === "suspend") {
        await adminService.suspendUser(user.id, "Suspended by admin via panel");
      } else {
        await adminService.activateUser(user.id);
      }

      // Update local state instantly
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                is_active: action === "activate",
                status: action === "activate" ? "active" : "suspended",
              }
            : u
        )
      );
      setActionTarget(null);
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        `Failed to ${action} user.`;
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-inter">
      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(actionTarget)}
        title={actionTarget?.action === "suspend" ? "Suspend User Account" : "Activate User Account"}
        message={
          actionTarget?.action === "suspend"
            ? `Are you sure you want to suspend account "${actionTarget?.user?.username || actionTarget?.user?.email}"? They will lose access to the platform.`
            : `Are you sure you want to reactivate account "${actionTarget?.user?.username || actionTarget?.user?.email}"?`
        }
        confirmText={actionTarget?.action === "suspend" ? "Suspend Account" : "Activate Account"}
        variant={actionTarget?.action === "suspend" ? "danger" : "primary"}
        isLoading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setActionTarget(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-space-grotesk text-slate-100 flex items-center gap-2">
            👥 User Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            View student accounts, statistics, penalty records, and manage access status.
          </p>
        </div>
      </div>

      {/* Permission / API Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Operation Error</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Controls Bar: Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by username, email, or full name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-slate-100 font-bold">{filteredUsers.length}</span> users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-semibold text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">XP</th>
                <th className="px-6 py-4">Attempts</th>
                <th className="px-6 py-4">Penalties</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-7 w-20 bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const isActive = user.is_active !== false && (user.status || "").toLowerCase() !== "suspended";
                  
                  // Check if this row is the currently logged in admin user
                  const isSelf =
                    (adminUser?.id != null && String(adminUser.id) === String(user.id)) ||
                    (adminUser?.email && adminUser.email.toLowerCase() === (user.email || "").toLowerCase());

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {(user.username || user.full_name || "U")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                              {user.username || user.full_name || "User"}
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{user.email || "—"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        Level {user.level ?? user.current_level ?? 1}
                      </td>

                      {/* XP */}
                      <td className="px-6 py-4 font-semibold text-amber-400">
                        {(user.total_xp ?? user.xp ?? 0).toLocaleString()} XP
                      </td>

                      {/* Quiz Attempts */}
                      <td className="px-6 py-4 text-slate-300">
                        {user.quizzes_completed ?? user.attempts_count ?? 0}
                      </td>

                      {/* Penalty Count */}
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${user.penalty_count > 0 ? "text-rose-400" : "text-slate-400"}`}>
                          {user.penalty_count ?? user.penalties_count ?? 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertOctagon size={12} /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {isActive ? (
                          <button
                            onClick={() => setActionTarget({ user, action: "suspend" })}
                            disabled={isSelf}
                            title={isSelf ? "You cannot suspend your own admin account" : "Suspend user account"}
                            className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-semibold hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px]"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setActionTarget({ user, action: "activate" })}
                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer text-[11px]"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-slate-400">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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

export default AdminUsersPage;
