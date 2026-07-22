import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileCheck2,
  FileQuestion,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import adminService from "../../services/adminService";

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between"
  >
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <h3 className="text-3xl font-extrabold text-slate-100 font-space-grotesk">
        {typeof value === "number" ? value.toLocaleString() : value}
      </h3>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3.5 rounded-2xl border ${colorClass}`}>
      <Icon size={22} />
    </div>
  </motion.div>
);

const SkeletonCard = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
    <div className="h-4 w-24 bg-slate-800 rounded mb-3" />
    <div className="h-8 w-16 bg-slate-800 rounded mb-2" />
    <div className="h-3 w-32 bg-slate-800 rounded" />
  </div>
);

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAnalytics();
      setData(res);
    } catch (err) {
      console.error("Failed to load admin analytics:", err);
      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to load admin analytics data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalUsers = data?.total_users ?? data?.users_count ?? 0;
  const totalAdminQuizzes = data?.total_admin_quizzes ?? data?.admin_quizzes_count ?? 0;
  const totalUserQuizzes = data?.total_user_quizzes ?? data?.user_quizzes_count ?? 0;
  const totalQuizAttempts = data?.total_quiz_attempts ?? data?.attempts_count ?? 0;
  const totalPenaltyPoints = data?.total_penalty_points ?? data?.penalty_points_count ?? 0;

  const subjectPerformance = data?.subject_performance ?? data?.subjects ?? [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-space-grotesk text-slate-100 flex items-center gap-2">
            📊 Admin Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time system overview and statistics across users, quizzes, attempts, and penalties.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Permission or API Error</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Counter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Users"
              value={totalUsers}
              subtext="Registered accounts"
              colorClass="bg-violet-500/10 text-violet-400 border-violet-500/20"
              delay={0.05}
            />
            <StatCard
              icon={FileCheck2}
              label="Admin Quizzes"
              value={totalAdminQuizzes}
              subtext="Curated by staff"
              colorClass="bg-blue-500/10 text-blue-400 border-blue-500/20"
              delay={0.1}
            />
            <StatCard
              icon={FileQuestion}
              label="User Quizzes"
              value={totalUserQuizzes}
              subtext="AI-generated"
              colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              delay={0.15}
            />
            <StatCard
              icon={TrendingUp}
              label="Quiz Attempts"
              value={totalQuizAttempts}
              subtext="Completed submissions"
              colorClass="bg-amber-500/10 text-amber-400 border-amber-500/20"
              delay={0.2}
            />
            <StatCard
              icon={ShieldAlert}
              label="Penalty Points"
              value={totalPenaltyPoints}
              subtext="Logged violations"
              colorClass="bg-rose-500/10 text-rose-400 border-rose-500/20"
              delay={0.25}
            />
          </>
        )}
      </div>

      {/* Subject Performance Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold font-space-grotesk text-slate-100 flex items-center gap-2">
              <BarChart3 size={20} className="text-violet-400" />
              Subject Performance
            </h2>
            <p className="text-xs text-slate-400 mt-1">Average scores and completion volume per topic category</p>
          </div>
        </div>

        {loading ? (
          <div className="h-48 bg-slate-950/50 rounded-xl animate-pulse flex items-center justify-center text-slate-700 text-sm">
            Loading performance metrics...
          </div>
        ) : subjectPerformance.length > 0 ? (
          <div className="space-y-4">
            {subjectPerformance.map((subj, i) => {
              const name = subj.subject || subj.name || subj.category || `Category ${i + 1}`;
              const score = subj.average_score ?? subj.score ?? subj.accuracy ?? 0;
              const count = subj.attempts_count ?? subj.count ?? 0;

              return (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>{name}</span>
                    <span className="text-violet-400 font-bold">{Math.round(score)}% avg ({count} attempts)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <BarChart3 size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-400">No Subject Performance Data</p>
            <p className="text-xs text-slate-600 mt-1">Analytics will render here as quiz attempts accumulate.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
