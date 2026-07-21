import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Target,
  Trophy,
  XCircle,
  RotateCcw,
} from "lucide-react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import attemptsService from "../../services/attemptsService";
import { getLanguageIcon } from "../../utils/languageIcons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const difficultyVariant = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "danger",
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

const StatCard = ({ icon: Icon, label, value, detail, tone }) => (
  <Card hover className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-3 font-space-grotesk text-3xl font-bold text-app">
          {value}
        </p>
        <p className="mt-1 text-xs font-medium text-app-muted">{detail}</p>
      </div>
      <div className={`rounded-2xl p-3 ${tone}`}>
        <Icon size={22} />
      </div>
    </div>
  </Card>
);

const ScoreRing = ({ percentage }) => {
  const circumference = 2 * Math.PI * 38;
  const offset = circumference * (1 - percentage / 100);
  const color =
    percentage >= 80
      ? "stroke-emerald-500"
      : percentage >= 60
        ? "stroke-amber-500"
        : "stroke-red-500";

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="transparent"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-space-grotesk text-xl font-bold text-app">
          {percentage}%
        </span>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Score</span>
      </div>
    </div>
  );
};

const AttemptCard = ({ attempt }) => {
  // Support both "Passed"/"passed" and "Failed"/"failed" from the backend
  const statusNormalised = (attempt.status || "").toLowerCase();
  const passed = statusNormalised === "passed";
  const displayStatus = passed ? "Passed" : "Failed";

  const score = `${attempt.correct_count} / ${attempt.total_questions}`;
  const percentage = attempt.score ?? 0;
  const timeTaken = formatTime(attempt.time_spent_seconds ?? 0);
  const date = formatDate(attempt.date);
  const difficulty = attempt.difficulty_level || attempt.difficulty || "";
  const category = attempt.category || "";

  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleViewResult = () => {
    // QuizResultsPage always fetches its own data from GET /api/attempts/{id}/result/
    // No need to prefetch here — just navigate directly.
    navigate(`/results/${attempt.id}`);
  };

  const { icon: LangIcon, color: iconColor } = getLanguageIcon(attempt.category || attempt.subject);

  const [retryError, setRetryError] = useState(null);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      setRetryError(null);
      const res = await attemptsService.startAttempt(attempt.quiz_id);
      navigate(`/attempts/${res.attempt_id || res.id}`);
    } catch (err) {
      console.error(err);
      setRetryError(err?.response?.data?.message || "Failed to start a new attempt. Please try again later.");
      setTimeout(() => setRetryError(null), 4000);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card hover className="group overflow-hidden p-5 relative">
      {retryError && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-between">
          <span>{retryError}</span>
          <button onClick={() => setRetryError(null)} className="text-red-500 font-bold">&times;</button>
        </div>
      )}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div 
            className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 sm:flex bg-[var(--bg-elevated)]"
          >
            <LangIcon size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h3 className="truncate font-space-grotesk text-lg font-bold text-app transition-colors group-hover:text-violet-700">
                  {attempt.quiz_title}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {category && (
                    <Badge variant="gray">
                      {category}
                    </Badge>
                  )}
                  {difficulty && (
                    <Badge variant={difficultyVariant[difficulty] || "gray"}>
                      {difficulty}
                    </Badge>
                  )}
                  <Badge variant={passed ? "success" : "danger"}>
                    {passed ? (
                      <CheckCircle2 size={13} className="mr-1" />
                    ) : (
                      <XCircle size={13} className="mr-1" />
                    )}
                    {displayStatus}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-app-muted">
                <CalendarDays size={16} className="text-app-muted" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-app-muted">
                <Award size={16} className="text-app-muted" />
                <span>{score}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-app-muted">
                <Clock3 size={16} className="text-app-muted" />
                <span>{timeTaken}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:w-[310px] lg:justify-end">
          <ScoreRing percentage={Math.round(percentage)} />
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[168px] sm:grid-cols-1">
            <Button size="sm" className="gap-2" onClick={handleViewResult} disabled={isRetrying}>
              <FileCheck2 size={15} />
              View Result
            </Button>
            <Button variant="secondary" size="sm" className="gap-2" onClick={handleRetry} disabled={isRetrying}>
              {isRetrying ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <RotateCcw size={15} />
              )}
              {isRetrying ? "Starting..." : "Retry Quiz"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const AttemptsSkeleton = () => (
  <div className="grid gap-4">
    {[1, 2, 3].map((item) => (
      <Card key={item} className="p-5">
        <div className="flex animate-pulse flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="hidden h-14 w-14 rounded-2xl bg-slate-200 sm:block" />
            <div className="flex-1 space-y-4">
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="flex gap-2">
                <div className="h-7 w-24 rounded-full bg-slate-200" />
                <div className="h-7 w-28 rounded-full bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 rounded bg-slate-200" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-9 w-36 rounded-xl bg-slate-200" />
              <div className="h-9 w-36 rounded-xl bg-slate-200" />
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const EmptyState = () => (
  <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-violet-200 bg-violet-50 text-violet-600">
      <FileCheck2 size={34} />
    </div>
    <h3 className="mt-5 font-space-grotesk text-xl font-bold text-app">
      No attempts found
    </h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-app-muted">
      Start a new quiz to build your attempt history.
    </p>
    <Link to="/library" className="mt-6">
      <Button>Explore Quizzes</Button>
    </Link>
  </Card>
);

const MyAttempts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [attemptsData, setAttemptsData] = useState([]);
  const [statsData, setStatsData] = useState(null);

  // Fetch attempts history on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await attemptsService.getHistory();
        if (!cancelled) {
          setAttemptsData(data.attempts ?? []);
          setStatsData(data.stats ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(
            err?.response?.data?.detail ??
            err?.response?.data?.message ??
            "Failed to load your attempts. Please try again."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Derive stats: prefer backend stats, fall back to computed
  const stats = useMemo(() => {
    if (statsData) {
      return {
        totalAttempts: statsData.total_attempts ?? attemptsData.length,
        averageScore: Math.round(statsData.average_score ?? 0),
        bestScore: Math.round(statsData.best_score ?? 0),
        successRate: Math.round(statsData.success_rate ?? 0),
      };
    }
    // Computed fallback
    const total = attemptsData.length;
    if (total === 0) return { totalAttempts: 0, averageScore: 0, bestScore: 0, successRate: 0 };
    const averageScore = Math.round(
      attemptsData.reduce((sum, a) => sum + (a.score ?? 0), 0) / total
    );
    const bestScore = Math.max(...attemptsData.map((a) => a.score ?? 0));
    const successRate = Math.round(
      (attemptsData.filter((a) => (a.status || "").toLowerCase() === "passed").length / total) * 100
    );
    return { totalAttempts: total, averageScore, bestScore, successRate };
  }, [statsData, attemptsData]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <h1 className="font-space-grotesk text-2xl font-bold text-app">
            My Attempts
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-app-muted">
            Review your quiz history, compare scores, and jump back into any
            quiz when you want another run.
          </p>
        </div>

      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={FileCheck2}
          label="Total Attempts"
          value={stats.totalAttempts}
          detail="Across all quizzes"
          tone="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={Target}
          label="Average Score"
          value={`${stats.averageScore}%`}
          detail="Current performance"
          tone="bg-sky-50 text-sky-600"
        />
        <StatCard
          icon={Trophy}
          label="Best Score"
          value={`${stats.bestScore}%`}
          detail="Highest attempt"
          tone="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Success Rate"
          value={`${stats.successRate}%`}
          detail="Passed attempts"
          tone="bg-emerald-50 text-emerald-600"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col gap-4"
      >
        {isLoading ? (
          <AttemptsSkeleton />
        ) : apiError ? (
          <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50 text-red-500">
              <XCircle size={34} />
            </div>
            <h3 className="mt-5 font-space-grotesk text-xl font-bold text-app">
              Failed to load attempts
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-app-muted">{apiError}</p>
          </Card>
        ) : attemptsData.length > 0 ? (
          attemptsData.map((attempt) => (
            <AttemptCard key={attempt.id} attempt={attempt} />
          ))
        ) : (
          <EmptyState />
        )}
      </motion.div>
    </div>
  );
};

export default MyAttempts;
