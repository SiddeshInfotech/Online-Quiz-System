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
  PieChart,
  Award,
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

const SubjectRow = ({
  title,
  value,
  progress = 0,
  colorClass = "from-violet-500 to-indigo-500",
  valueColorClass = "text-violet-400",
  delay = 0,
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs font-semibold text-slate-300">
      <span>{title}</span>
      <span className={`${valueColorClass} font-bold`}>{value}</span>
    </div>
    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 0.6, delay }}
        className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
      />
    </div>
  </div>
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
      // Handle response wrapping if returned under res.data or direct res
      const rawData = res?.data ?? res;
      setData(rawData);
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

  const analytics = data?.analytics ?? data ?? {};
  const overview = analytics.overview ?? data?.overview ?? analytics ?? {};

  const totalUsers =
    overview.total_users ?? overview.users_count ?? overview.total_users_count ?? data?.total_users ?? data?.users_count ?? 0;

  const totalAdminQuizzes =
    overview.admin_quizzes ??
    overview.total_admin_quizzes ??
    overview.admin_quizzes_count ??
    data?.total_admin_quizzes ??
    data?.admin_quizzes_count ??
    0;

  const totalUserQuizzes =
    overview.user_quizzes ??
    overview.total_user_quizzes ??
    overview.user_quizzes_count ??
    data?.total_user_quizzes ??
    data?.user_quizzes_count ??
    0;

  const totalQuizAttempts =
    overview.total_attempts ??
    overview.total_quiz_attempts ??
    overview.attempts_count ??
    data?.total_quiz_attempts ??
    data?.attempts_count ??
    0;

  const totalPenaltyPoints =
    overview.penalty_points ??
    overview.total_penalty_points ??
    overview.penalty_points_count ??
    data?.total_penalty_points ??
    data?.penalty_points_count ??
    0;

  // 1. & 5. Subject Performance & Distribution Normalization (Restricted to 11 valid subjects)
  const VALID_SUBJECTS = [
    "C", "JavaScript", "Java", "Python", "C++", "TypeScript",
    "Rust", "Node.js", "Flask", "Django", "React"
  ];

  const normalizeSubject = (name) => {
    if (!name) return null;
    const n = String(name).trim().toLowerCase();

    if (n === "c" || n === "c programming") return "C";
    if (n === "javascript" || n === "js") return "JavaScript";
    if (n === "java") return "Java";
    if (n === "python" || n === "python programming") return "Python";
    if (n === "c++" || n === "cpp") return "C++";
    if (n === "typescript" || n === "ts") return "TypeScript";
    if (n === "rust") return "Rust";
    if (n === "node.js" || n === "node" || n === "nodejs" || n === "express.js" || n === "express") return "Node.js";
    if (n === "flask") return "Flask";
    if (n === "django") return "Django";
    if (n === "react" || n === "react.js" || n === "reactjs") return "React";

    const match = VALID_SUBJECTS.find((s) => s.toLowerCase() === n);
    return match || null;
  };

  const rawSubjectPerformance =
    analytics?.subject_performance ??
    analytics?.performance?.subject_performance ??
    analytics?.overview?.subject_performance ??
    analytics?.top_subjects ??
    overview?.subject_performance ??
    overview?.top_subjects ??
    [];

  const performanceMap = {};
  if (Array.isArray(rawSubjectPerformance)) {
    rawSubjectPerformance.forEach((item, i) => {
      const rawName = typeof item === "string" ? item : item.subject || item.name || item.category || `Subject ${i + 1}`;
      const normName = normalizeSubject(rawName);
      if (!normName) return;

      const attempts = typeof item === "object" ? (item.attempts ?? item.count ?? item.attempts_count ?? item.total_attempts ?? 0) : 0;
      const avgScore = typeof item === "object" ? (item.average_score ?? item.avg_score ?? item.score ?? item.accuracy ?? item.average ?? null) : null;

      if (!performanceMap[normName]) {
        performanceMap[normName] = { subject: normName, attempts: 0, totalScore: 0, scoreCount: 0 };
      }
      performanceMap[normName].attempts += Number(attempts) || 0;
      if (avgScore != null && !isNaN(Number(avgScore))) {
        performanceMap[normName].totalScore += Number(avgScore);
        performanceMap[normName].scoreCount += 1;
      }
    });
  }

  const subjectPerformance = Object.values(performanceMap).map((item) => ({
    subject: item.subject,
    attempts: item.attempts,
    average_score: item.scoreCount > 0 ? Number((item.totalScore / item.scoreCount).toFixed(1)) : null,
  }));

  // 4. Subject Distribution (separate from performance)
  const rawSubjectDistribution =
    analytics?.subject_distribution ??
    analytics?.distribution?.subject_distribution ??
    analytics?.overview?.subject_distribution ??
    data?.subject_distribution ??
    data?.distribution?.subject_distribution ??
    overview?.subject_distribution ??
    data?.subject_distribution_chart ??
    [];

  const distributionMap = {};
  const rawDistList = Array.isArray(rawSubjectDistribution)
    ? rawSubjectDistribution
    : typeof rawSubjectDistribution === "object" && rawSubjectDistribution !== null
    ? Object.entries(rawSubjectDistribution).map(([name, val]) => ({
        subject: name,
        attempts: typeof val === "number" ? val : val?.attempts ?? val?.count ?? 0,
      }))
    : [];

  rawDistList.forEach((item, i) => {
    const rawName = typeof item === "string" ? item : item.subject || item.name || item.category || `Category ${i + 1}`;
    const normName = normalizeSubject(rawName);
    if (!normName) return;

    const attempts = typeof item === "object" ? (item.attempts ?? item.count ?? item.quizzes_count ?? item.total_quizzes ?? item.user_quizzes ?? 0) : 0;

    if (!distributionMap[normName]) {
      distributionMap[normName] = { subject: normName, attempts: 0 };
    }
    distributionMap[normName].attempts += Number(attempts) || 0;
  });

  const subjectDistribution = Object.values(distributionMap);

  const maxAttempts = Math.max(
    ...subjectDistribution.map((item) => item.attempts),
    ...subjectPerformance.map((item) => item.attempts),
    1
  );

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

      {/* Charts & Subject Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Subjects & Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold font-space-grotesk text-slate-100 flex items-center gap-2">
                  <Award size={20} className="text-violet-400" />
                  Top Subjects & Performance
                </h2>
                <p className="text-xs text-slate-400 mt-1">Average score accuracy and attempt volume by topic</p>
              </div>
            </div>

            {loading ? (
              <div className="h-48 bg-slate-950/50 rounded-xl animate-pulse flex items-center justify-center text-slate-700 text-sm">
                Loading subject performance...
              </div>
            ) : subjectPerformance.length > 0 ? (
              <div className="space-y-4">
                {subjectPerformance.map((item, i) => (
                  <SubjectRow
                    key={item.subject}
                    title={item.subject}
                    value={
                      item.average_score != null
                        ? `${item.average_score.toFixed(1)}% avg`
                        : `${item.attempts} ${item.attempts === 1 ? "attempt" : "attempts"}`
                    }
                    progress={
                      item.average_score != null
                        ? item.average_score
                        : (item.attempts / maxAttempts) * 100
                    }
                    colorClass="from-violet-500 to-indigo-500"
                    valueColorClass="text-violet-400"
                    delay={i * 0.05}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                <BarChart3 size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-400">No Top Subjects Data</p>
                <p className="text-xs text-slate-600 mt-1">Analytics will render here as quiz attempts accumulate.</p>
              </div>
            )}
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold font-space-grotesk text-slate-100 flex items-center gap-2">
                  <PieChart size={20} className="text-emerald-400" />
                  Subject Distribution
                </h2>
                <p className="text-xs text-slate-400 mt-1">Breakdown of quiz attempts by subject category</p>
              </div>
            </div>

            {loading ? (
              <div className="h-48 bg-slate-950/50 rounded-xl animate-pulse flex items-center justify-center text-slate-700 text-sm">
                Loading subject distribution...
              </div>
            ) : subjectDistribution.length > 0 ? (
              <div className="space-y-4">
                {subjectDistribution.map((item, i) => {
                  const width = (item.attempts / maxAttempts) * 100;
                  const attemptLabel = `${item.attempts} ${item.attempts === 1 ? "attempt" : "attempts"}`;

                  return (
                    <SubjectRow
                      key={item.subject}
                      title={item.subject}
                      value={attemptLabel}
                      progress={width}
                      colorClass="from-emerald-500 to-teal-500"
                      valueColorClass="text-emerald-400"
                      delay={i * 0.05}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                <PieChart size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-400">No Subject Distribution Data</p>
                <p className="text-xs text-slate-600 mt-1">Quiz category distribution will be displayed here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
