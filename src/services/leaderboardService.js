/**
 * leaderboardService.js
 *
 * Fetches live leaderboard data from GET /api/leaderboard/
 * and normalises the response into the shape LeaderboardPage expects.
 *
 * Scoring rule: 1 correct answer = 1 point, wrong = 0.
 * Total points = sum of correct answers across ALL completed quizzes.
 * Users are ranked by total points (highest first).
 *
 * The adapter handles:
 *  - snake_case ↔ camelCase field names
 *  - nested objects ↔ flat structures
 *  - safe defaults for every field
 */

import api from "./api";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Pick the first non-null/undefined value from a list of candidates. */
const pick = (...candidates) =>
  candidates.find((v) => v !== undefined && v !== null);

/**
 * Build a ui-avatars URL for a display name.
 * Used as a fallback when no avatar URL is provided.
 */
const fallbackAvatar = (name = "User") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6D5EF9&color=fff`;

// ─────────────────────────────────────────────────────────────────────────────
// Adapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalises a single leaderboard entry from the backend.
 *
 * Expected frontend shape for each entry:
 * {
 *   rank:            number   – 1-based rank position
 *   userId:          string   – unique user identifier
 *   username:        string   – display username
 *   fullName:        string   – full display name (falls back to username)
 *   avatar:          string   – avatar URL
 *   points:          number   – total correct answers (= total points)
 *   quizzesCompleted: number  – total quizzes finished
 * }
 */
const adaptEntry = (raw = {}, index) => {
  const username =
    pick(raw.username, raw.user_name, raw.display_name) ?? `User ${index + 1}`;
  const fullName = pick(raw.full_name, raw.fullName, raw.name, username) ?? username;
  const avatar =
    pick(raw.avatar, raw.profile_picture, raw.profile_pic) || fallbackAvatar(fullName);

  return {
    rank: pick(raw.rank, raw.position, index + 1),
    userId: String(pick(raw.id, raw.user_id, raw.userId) ?? index),
    username,
    fullName,
    avatar,
    // Points = correct answers total. Accept multiple backend field names.
    points: Number(
      pick(
        raw.your_points,
        raw.total_points,
        raw.points,
        raw.score,
        raw.total_correct,
        raw.correct_answers,
        raw.total_score
      ) ?? 0
    ),
    quizzesCompleted: Number(
      pick(
        raw.quizzes_count,
        raw.quizzes_completed,
        raw.quizzesCompleted,
        raw.total_quizzes,
        raw.attempts_count,
        raw.quiz_count
      ) ?? 0
    ),
  };
};

const adaptResponse = (raw = {}) => {
  // Unwrap the list of entries
  const rawList = Array.isArray(raw.all_rankings_list)
    ? raw.all_rankings_list
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw.leaderboard)
    ? raw.leaderboard
    : Array.isArray(raw.results)
    ? raw.results
    : Array.isArray(raw.data)
    ? raw.data
    : [];

  const adaptAndSortList = (list) => {
    // Sort by points descending
    const sorted = [...list].sort(
      (a, b) =>
        Number(
          pick(b.total_points, b.points, b.score, b.total_correct, b.total_score) ?? 0
        ) -
        Number(
          pick(a.total_points, a.points, a.score, a.total_correct, a.total_score) ?? 0
        )
    );

    // Assign ranks after sorting
    const entries = sorted.map((entry, idx) => {
      const adapted = adaptEntry(entry, idx);
      // If the backend didn't provide a rank, assign it based on position
      if (entry.rank === undefined && entry.position === undefined) {
        adapted.rank = idx + 1;
      }
      return adapted;
    });

    // Resolve ties if ranks were purely generated
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].points === entries[i - 1].points && entries[i].rank === i + 1) {
        entries[i].rank = entries[i - 1].rank;
      }
    }
    return entries;
  };

  const entries = adaptAndSortList(rawList);
  
  // Use top_3_podium if provided, otherwise derive from entries
  const rawTop3 = Array.isArray(raw.top_3_podium) ? raw.top_3_podium : null;
  const top3 = rawTop3 ? adaptAndSortList(rawTop3) : entries.slice(0, 3);

  // ── personal_stats (new backend contract) ──────────────────────────────────
  // Backend returns:
  //   personal_stats: { your_rank, is_in_top_3, badge_count, ... }
  // We must NEVER manually inject the current user into the podium.
  // isInTop3 is the authoritative flag from the backend.
  const rawPersonalStats = raw.personal_stats ?? raw.current_user ?? raw.currentUser ?? raw.me ?? null;

  let currentUser = null;
  // is_in_top_3 is explicitly set by the backend
  const isInTop3 = rawPersonalStats?.is_in_top_3 === true;

  if (rawPersonalStats) {
    const userId = String(
      pick(rawPersonalStats.id, rawPersonalStats.user_id, rawPersonalStats.userId) ?? ""
    );

    // Build current user entry for summary cards (rank/points/quizzes)
    currentUser = adaptEntry(rawPersonalStats, entries.length);

    // Explicitly map points and quizzes for currentUser based on backend fields
    const backendPoints = pick(rawPersonalStats.your_points);
    if (backendPoints !== undefined && backendPoints !== null) {
      currentUser.points = Number(backendPoints);
    }

    const backendQuizzes = pick(rawPersonalStats.quizzes_completed, rawPersonalStats.quizzes_count);
    if (backendQuizzes !== undefined && backendQuizzes !== null) {
      currentUser.quizzesCompleted = Number(backendQuizzes);
    }

    // Use your_rank from personal_stats if available
    const backendRank = pick(
      rawPersonalStats.your_rank,
      rawPersonalStats.rank,
      rawPersonalStats.position
    );
    if (backendRank !== undefined && backendRank !== null) {
      currentUser.rank = backendRank;
    } else if (userId) {
      const existing = entries.find((e) => e.userId === userId);
      if (existing) currentUser.rank = existing.rank;
    }

    // Attach badge_count if provided
    if (rawPersonalStats.badge_count !== undefined) {
      currentUser.badgeCount = rawPersonalStats.badge_count;
    }
  }

  return { entries, top3, currentUser, isInTop3 };
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the leaderboard from the backend.
 * Returns { entries, currentUser }.
 */
export const fetchLeaderboard = async () => {
  try {
    const { data } = await api.get("leaderboard/global/");
    return adaptResponse(data);
  } catch (error) {
    // Fall back to mock data if the backend is not integrated yet (e.g. 404 or Network Error)
    if (!error.response || error.response.status === 404) {
      console.warn("Backend not integrated. Using mock leaderboard data.");
      return adaptResponse(getMockLeaderboardData());
    }
    // Throw error if it's an actual API failure (e.g. 500)
    throw error;
  }
};

const getMockLeaderboardData = () => ({
  leaderboard: [
    {
      id: "mock_1",
      username: "quiz_master",
      full_name: "Alex Turner",
      total_points: 12450,
      quizzes_completed: 142,
      avatar: "https://ui-avatars.com/api/?name=Alex+Turner&background=8B5CF6&color=fff",
    },
    {
      id: "mock_2",
      username: "brainiac99",
      full_name: "Sarah Chen",
      total_points: 11200,
      quizzes_completed: 128,
      avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=10B981&color=fff",
    },
    {
      id: "mock_3",
      username: "trivia_king",
      full_name: "Marcus Johnson",
      total_points: 9850,
      quizzes_completed: 115,
      avatar: "https://ui-avatars.com/api/?name=Marcus+Johnson&background=F59E0B&color=fff",
    },
    {
      id: "mock_4",
      username: "knowledge_seeker",
      full_name: "Emily Davis",
      total_points: 8700,
      quizzes_completed: 98,
      avatar: "https://ui-avatars.com/api/?name=Emily+Davis&background=3B82F6&color=fff",
    },
    {
      id: "mock_5",
      username: "quick_thinker",
      full_name: "David Smith",
      total_points: 7900,
      quizzes_completed: 85,
      avatar: "https://ui-avatars.com/api/?name=David+Smith&background=EC4899&color=fff",
    },
    {
      id: "mock_6",
      username: "puzzle_solver",
      full_name: "Jessica Lee",
      total_points: 6500,
      quizzes_completed: 72,
      avatar: "https://ui-avatars.com/api/?name=Jessica+Lee&background=6366F1&color=fff",
    },
    {
      id: "mock_7",
      username: "fact_checker",
      full_name: "Michael Brown",
      total_points: 5400,
      quizzes_completed: 60,
      avatar: "https://ui-avatars.com/api/?name=Michael+Brown&background=14B8A6&color=fff",
    },
    {
      id: "mock_8",
      username: "curious_mind",
      full_name: "Olivia Wilson",
      total_points: 4200,
      quizzes_completed: 45,
      avatar: "https://ui-avatars.com/api/?name=Olivia+Wilson&background=F43F5E&color=fff",
    },
    {
      id: "mock_9",
      username: "learning_pro",
      full_name: "Daniel Taylor",
      total_points: 3100,
      quizzes_completed: 32,
      avatar: "https://ui-avatars.com/api/?name=Daniel+Taylor&background=8B5CF6&color=fff",
    },
    {
      id: "mock_10",
      username: "quiz_newbie",
      full_name: "Sophia Anderson",
      total_points: 1500,
      quizzes_completed: 15,
      avatar: "https://ui-avatars.com/api/?name=Sophia+Anderson&background=10B981&color=fff",
    },
  ],
});

export default { fetchLeaderboard };
