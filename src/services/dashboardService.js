/**
 * dashboardService.js
 *
 * Fetches live data from GET /api/analytics/summary/ and normalises
 * the response into the exact shape every dashboard component expects.
 *
 * The adapter handles:
 *  - snake_case  ↔  camelCase field names
 *  - nested objects  ↔  flat structures
 *  - safe defaults for every field (0 for numbers, [] for arrays, etc.)
 *
 * If the backend ever changes its response shape, only this file needs
 * to be updated — no component or hook changes required.
 */

import api from "./api";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Pick the first non-null/undefined value from a list of candidates. */
const pick = (...candidates) => candidates.find((v) => v !== undefined && v !== null);

/** Map a subject/topic string to a known icon type for RecentAttempts. */
const deriveIconType = (subject = "") => {
  const s = subject.toLowerCase();
  if (s.includes("chem")) return "chemistry";
  if (s.includes("bio")) return "biology";
  if (s.includes("math")) return "math";
  if (s.includes("hist")) return "history";
  return "default";
};

/**
 * Convert an ISO timestamp / date string to a short human-readable label.
 * Falls back to the raw value if parsing fails.
 */
const formatDate = (raw) => {
  if (!raw) return "Recently";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(raw);
  }
};

/** Format total minutes → "Xh Ym" string. */
const formatTimeSpent = (raw) => {
  if (raw == null) return "0h 0m";
  if (typeof raw === "string") return raw; // already formatted
  const mins = Number(raw);
  if (isNaN(mins)) return "0h 0m";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Adapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalises the raw /api/analytics/summary/ response into the shape
 * consumed by every dashboard component.
 *
 * Expected frontend shape:
 * {
 *   user:                { name, avatar, streak, maxStreak, progress, totalQuizzes, completedQuizzes }
 *   dailyGoal:           { completed, total }
 *   lastQuiz:            null | { title, subject, classLevel, progress }
 *   availableQuizzesCount: number
 *   recentAttempts:      Array<{ id, title, subject, classLevel, iconType, score, date }>
 *   performanceStats:    { quizzesAttempted, averageScore, accuracy, timeSpent }
 *   chartData:           Array<{ day, score }>
 *   notifications:       Array<{ id, text, time, iconType }>
 * }
 */
const adaptResponse = (raw = {}) => {
  // ── User ─────────────────────────────────────────────────────────────────
  // Backend may nest user fields inside a "user" object or put them at root.
  const rawUser = raw?.user ?? {};

  const userName =
    pick(
      rawUser?.full_name,
      rawUser?.name,
      rawUser?.username,
      raw?.full_name,
      raw?.name,
      raw?.username
    ) ?? "Student";

  const user = {
    name: userName,
    avatar:
      pick(rawUser?.avatar, rawUser?.profile_picture, raw?.avatar) ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6D5EF9&color=fff`,
    email: pick(rawUser?.email, raw?.email) ?? "",
    role: pick(rawUser?.role, raw?.role) ?? "student",
    streak: Number(pick(raw?.streak, rawUser?.streak, raw?.current_streak) ?? 0),
    maxStreak: Number(pick(raw?.max_streak, rawUser?.max_streak, raw?.best_streak) ?? 0),
    progress: Number(
      pick(raw?.progress, rawUser?.progress, raw?.completion_percentage) ?? 0
    ),
    totalQuizzes: Number(
      pick(raw?.total_quizzes, rawUser?.total_quizzes, raw?.quiz_count) ?? 0
    ),
    completedQuizzes: Number(
      pick(
        raw?.completed_quizzes,
        rawUser?.completed_quizzes,
        raw?.quizzes_completed
      ) ?? 0
    ),
  };

  // ── Daily Goal ────────────────────────────────────────────────────────────
  const rawGoal = raw?.daily_goal ?? raw?.dailyGoal ?? {};
  const dailyGoal = {
    completed: Number(pick(rawGoal?.completed, raw?.daily_goal_completed) ?? 0),
    total: Number(pick(rawGoal?.total, raw?.daily_goal_total) ?? 3),
  };

  // ── Last Quiz ─────────────────────────────────────────────────────────────
  const rawLast = raw?.last_quiz ?? raw?.lastQuiz ?? null;
  const lastQuiz = rawLast
    ? {
        title: pick(rawLast.title, rawLast.quiz_title) ?? "Untitled Quiz",
        subject: pick(rawLast.subject, rawLast.topic) ?? "General",
        classLevel: pick(rawLast.class_level, rawLast.classLevel, rawLast.grade) ?? "",
        progress: Number(
          pick(rawLast.progress, rawLast.completion_percentage) ?? 0
        ),
      }
    : null;

  // ── Available Quizzes ─────────────────────────────────────────────────────
  const availableQuizzesCount = Number(
    pick(
      raw?.available_quizzes_count,
      raw?.availableQuizzesCount,
      raw?.available_quizzes,
      raw?.total_available_quizzes
    ) ?? 0
  );

  // ── Recent Attempts ───────────────────────────────────────────────────────
  const rawAttempts = raw?.recent_attempts ?? raw?.recentAttempts ?? [];
  const recentAttempts = Array.isArray(rawAttempts)
    ? rawAttempts.map((a, i) => ({
        id: pick(a.id, a.attempt_id, a.quiz_attempt_id) ?? i,
        title: pick(a.title, a.quiz_title, a.quiz_name) ?? "Untitled Quiz",
        subject: pick(a.subject, a.topic, a.category) ?? "General",
        classLevel: pick(a.class_level, a.classLevel, a.grade, a.standard) ?? "",
        iconType: deriveIconType(pick(a.subject, a.topic, a.category) ?? ""),
        score: Number(pick(a.score, a.percentage, a.marks, a.obtained_marks) ?? 0),
        date: formatDate(pick(a.date, a.attempted_at, a.created_at, a.submitted_at)),
        quiz_id: pick(a.quiz_id, a.quiz) ?? null,
      }))
    : [];

  // ── Performance Stats ─────────────────────────────────────────────────────
  // Backend may put stats inside a nested object or at root.
  const rawStats =
    raw?.performance_stats ?? raw?.performanceStats ?? raw?.stats ?? {};

  const performanceStats = {
    quizzesAttempted: Number(
      pick(
        rawStats?.quizzes_attempted,
        rawStats?.quizzesAttempted,
        raw?.quizzes_attempted,
        raw?.total_attempts
      ) ?? 0
    ),
    averageScore: Number(
      pick(
        rawStats?.average_score,
        rawStats?.averageScore,
        raw?.average_score,
        raw?.avg_score
      ) ?? 0
    ),
    accuracy: Number(
      pick(rawStats?.accuracy, raw?.accuracy, raw?.avg_accuracy) ?? 0
    ),
    timeSpent: formatTimeSpent(
      pick(rawStats?.time_spent, rawStats?.timeSpent, raw?.time_spent, raw?.total_time)
    ),
  };

  // ── Chart Data ────────────────────────────────────────────────────────────
  const rawChart =
    raw?.chart_data ?? raw?.chartData ?? raw?.weekly_scores ?? raw?.performance_chart ?? [];
  const chartData = Array.isArray(rawChart)
    ? rawChart.map((d) => ({
        day: pick(d.day, d.label, d.date, d.period) ?? "",
        score: Number(pick(d.score, d.value, d.percentage, d.avg_score) ?? 0),
      }))
    : [];

  // ── Notifications ─────────────────────────────────────────────────────────
  const rawNotifs = raw?.notifications ?? [];
  const notifications =
    Array.isArray(rawNotifs) && rawNotifs.length > 0
      ? rawNotifs.map((n, i) => ({
          id: pick(n.id, n.notification_id) ?? i,
          text: pick(n.text, n.message, n.body, n.description) ?? "",
          time: formatDate(pick(n.time, n.created_at, n.sent_at)) ?? "Recently",
          iconType: pick(n.icon_type, n.iconType, n.type) ?? "star",
        }))
      : [
          {
            id: 1,
            text: "Welcome to QuizGen AI! Start your first quiz today.",
            time: "Just now",
            iconType: "star",
          },
        ];

  return {
    user,
    dailyGoal,
    lastQuiz,
    availableQuizzesCount,
    recentAttempts,
    performanceStats,
    chartData,
    notifications,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the full dashboard payload from the backend and returns it
 * normalised into the shape expected by every dashboard component.
 */
export const fetchDashboardData = async () => {
  const { data } = await api.get("analytics/summary/");
  return adaptResponse(data);
};
