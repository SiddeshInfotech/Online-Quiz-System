import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  BookOpen,
  Award,
  Crown,
  Medal,
  RefreshCw,
  Users,
  AlertCircle,
  ChevronUp,
} from "lucide-react";

import Card from "../../components/ui/Card/Card";
import { AuthContext } from "../../context/AuthContext";
import { fetchLeaderboard } from "../../services/leaderboardService";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatPoints = (n) => String(n ?? 0);

const rankSuffix = (rank) => {
  if (rank === 11 || rank === 12 || rank === 13) return "th";
  const last = rank % 10;
  if (last === 1) return "st";
  if (last === 2) return "nd";
  if (last === 3) return "rd";
  return "th";
};

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────

const Avatar = ({ src, name, size = "md", ringColor = "" }) => {
  const [imgError, setImgError] = useState(false);
  const sizeMap = {
    xs: "w-8 h-8 text-xs",
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
    "2xl": "w-24 h-24 text-3xl",
  };

  const showInitials = !src || imgError || src.includes("ui-avatars.com");

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold font-space-grotesk ${
        ringColor ? `ring-4 ${ringColor}` : ""
      } ${showInitials ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white" : ""}`}
    >
      {showInitials ? (
        <span>{getInitials(name)}</span>
      ) : (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Summary Cards
// ─────────────────────────────────────────────────────────────────────────────

const SummaryCard = ({ icon: Icon, label, value, gradient, iconBg, delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    onClick={onClick}
    className={onClick ? "cursor-pointer" : ""}
  >
    <Card className={`p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${gradient}`}>
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-white group-hover:opacity-20 transition-opacity duration-500" />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">{label}</p>
          <p className="font-space-grotesk text-3xl font-bold">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg`}>
          <Icon size={26} />
        </div>
      </div>
    </Card>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Podium (Top 3)
// ─────────────────────────────────────────────────────────────────────────────

const podiumConfig = [
  // 2nd place (left)
  {
    position: 1,
    height: "h-16",
    avatarSize: "lg",
    bgGradient: "from-slate-400 to-slate-500",
    badgeBg: "bg-slate-400",
    textColor: "text-slate-600",
    ringColor: "ring-slate-300",
    crownColor: "text-slate-400",
    zIndex: "z-10",
    label: "2nd",
    icon: Medal,
  },
  // 1st place (center – tallest)
  {
    position: 0,
    height: "h-24",
    avatarSize: "xl",
    bgGradient: "from-amber-400 to-yellow-500",
    badgeBg: "bg-amber-400",
    textColor: "text-amber-600",
    ringColor: "ring-amber-300",
    crownColor: "text-amber-400",
    zIndex: "z-20",
    label: "1st",
    icon: Crown,
  },
  // 3rd place (right)
  {
    position: 2,
    height: "h-12",
    avatarSize: "md",
    bgGradient: "from-orange-400 to-amber-500",
    badgeBg: "bg-orange-400",
    textColor: "text-orange-600",
    ringColor: "ring-orange-300",
    crownColor: "text-orange-400",
    zIndex: "z-10",
    label: "3rd",
    icon: Medal,
  },
];

const PodiumBlock = ({ config, entry, isCurrentUser }) => {
  const Icon = config.icon;
  if (!entry) return <div className="flex-1" />;

  return (
    <motion.div
      className={`flex flex-col items-center flex-1 ${config.zIndex}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + config.position * 0.1 }}
    >
      {/* Crown / Medal icon */}
      <div className={`${config.crownColor} mb-1`}>
        <Icon size={config.position === 0 ? 26 : 20} fill="currentColor" />
      </div>

      {/* Avatar with optional "You" ring */}
      <div className="relative mb-1.5">
        <Avatar
          src={entry.avatar}
          name={entry.fullName || entry.username}
          size={config.avatarSize}
          ringColor={isCurrentUser ? "ring-violet-500" : config.ringColor}
        />
        {isCurrentUser && (
          <span className="absolute -bottom-1 -right-1 bg-violet-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 shadow">
            You
          </span>
        )}
      </div>

      {/* Display name & points */}
      <div className="text-center mb-1.5">
        <p
          className={`font-semibold text-app text-xs leading-tight truncate max-w-[80px] ${
            isCurrentUser ? "text-violet-700" : ""
          }`}
          title={entry.fullName || entry.username}
        >
          {entry.fullName || entry.username}
        </p>
        <p className="text-[10px] text-app-muted font-medium mt-0.5">
          {formatPoints(entry.points)} pts
        </p>
      </div>

      {/* Podium block */}
      <div
        className={`w-full rounded-t-xl ${config.height} bg-gradient-to-t ${config.bgGradient} flex items-start justify-center pt-2 shadow-lg`}
      >
        <span className="text-white font-bold font-space-grotesk text-sm">
          {config.label}
        </span>
      </div>
    </motion.div>
  );
};

const Podium = ({ top3, isInTop3 = false, currentUserId }) => {
  // Display order: 2nd, 1st, 3rd
  const displayOrder = [top3[1], top3[0], top3[2]];
  const configs = podiumConfig;

  if (top3.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="px-6 pt-5 pb-0 md:px-8 md:pt-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={20} className="text-amber-500" />
          <h2 className="font-space-grotesk text-base font-bold text-app">
            Top 3 Champions
          </h2>
        </div>
        <div className="flex items-end gap-2 sm:gap-3 justify-center">
          {displayOrder.map((entry, idx) => {
            // Only mark as current user if backend explicitly says is_in_top_3
            // AND the user's userId matches this entry (safety check)
            const isCurrentUser =
              isInTop3 && !!currentUserId && entry?.userId === currentUserId;
            return (
              <PodiumBlock
                key={configs[idx].label}
                config={configs[idx]}
                entry={entry}
                isCurrentUser={isCurrentUser}
              />
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Table Row
// ─────────────────────────────────────────────────────────────────────────────

const rankBadgeStyle = (rank) => {
  if (rank === 1) return "bg-amber-100 text-amber-700 border border-amber-200";
  if (rank === 2) return "surface-elev text-slate-600 border border-app";
  if (rank === 3) return "bg-orange-100 text-orange-700 border border-orange-200";
  return "surface text-app-muted border border-app";
};

const RankBadge = ({ rank }) => {
  if (rank === 1) return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 border border-amber-200">
      <Crown size={18} className="text-amber-500" fill="currentColor" />
    </div>
  );
  if (rank === 2) return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl surface-elev border border-app">
      <Medal size={18} className="text-app-muted" fill="currentColor" />
    </div>
  );
  if (rank === 3) return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-100 border border-orange-200">
      <Medal size={18} className="text-orange-500" fill="currentColor" />
    </div>
  );
  return (
    <div
      className={`flex items-center justify-center w-9 h-9 rounded-xl font-bold font-space-grotesk text-sm ${rankBadgeStyle(rank)}`}
    >
      {rank}
    </div>
  );
};

const TableRow = ({ id, entry, isCurrentUser, index }) => {
  return (
  <motion.tr
    id={id}
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: index * 0.03 }}
    className={`group transition-colors duration-200 ${
      isCurrentUser
        ? "bg-violet-50/70 dark:bg-violet-500/10 border-l-4 border-l-violet-500 ring-inset ring-1 ring-violet-100 dark:ring-violet-500/20"
        : "hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)]"
    }`}
  >
    {/* Rank */}
    <td className="py-3.5 pl-4 pr-3">
      <RankBadge rank={entry.rank} />
    </td>

    {/* Avatar + Display Name */}
    <td className="py-3.5 pr-4 min-w-0">
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Avatar
            src={entry.avatar}
            name={entry.fullName || entry.username}
            size="sm"
          />
          {isCurrentUser && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-violet-500 rounded-full border-2 border-white dark:border-slate-900" />
          )}
        </div>
        <p
          className={`font-semibold text-sm truncate ${
            isCurrentUser ? "text-violet-700 dark:text-violet-400" : "text-app"
          }`}
          title={entry.fullName || entry.username}
        >
          {entry.fullName || entry.username}
          {isCurrentUser && (
            <span className="ml-2 text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 rounded-full px-2 py-0.5 border border-violet-200 dark:border-violet-500/30">
              You
            </span>
          )}
        </p>
      </div>
    </td>


    {/* Points – right-aligned */}
    <td className="py-3.5 pr-4 text-right">
      <div className="flex items-center justify-end gap-1.5">
        <Star size={13} className="text-amber-400 flex-shrink-0" fill="currentColor" />
        <span
          className={`font-bold font-space-grotesk text-sm tabular-nums ${
            isCurrentUser ? "text-violet-700 dark:text-violet-400" : "text-app"
          }`}
        >
          {formatPoints(entry.points)}
        </span>
      </div>
    </td>

    {/* Quizzes – right-aligned */}
    <td className="py-3.5 pr-5 text-right">
      <div className="flex items-center justify-end gap-1.5">
        <BookOpen size={13} className="text-app-muted flex-shrink-0" />
        <span className="text-sm text-app-2 font-medium tabular-nums">
          {entry.quizzesCompleted}
        </span>
      </div>
    </td>
  </motion.tr>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

const LeaderboardSkeleton = () => (
  <div className="flex flex-col gap-6">
    {/* Summary cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-3xl bg-slate-200 h-28" />
      ))}
    </div>

    {/* Podium */}
    <div className="animate-pulse rounded-3xl surface-elev h-56" />

    {/* Table */}
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="w-9 h-9 bg-slate-200 rounded-xl" />
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
              <div className="h-3 w-1/5 surface-elev rounded" />
            </div>
            <div className="h-4 w-10 surface-elev rounded" />
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState = () => (
  <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-violet-200 bg-violet-50 text-violet-400 mb-5">
      <Users size={36} />
    </div>
    <h3 className="font-space-grotesk text-xl font-bold text-app mb-2">
      No rankings yet
    </h3>
    <p className="text-sm text-app-muted max-w-sm leading-relaxed">
      Be the first to complete a quiz and claim the top spot on the leaderboard!
    </p>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
// Error State
// ─────────────────────────────────────────────────────────────────────────────

const ErrorState = ({ message, onRetry }) => (
  <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50 text-red-400 mb-5">
      <AlertCircle size={36} />
    </div>
    <h3 className="font-space-grotesk text-xl font-bold text-app mb-2">
      Something went wrong
    </h3>
    <p className="text-sm text-app-muted max-w-sm leading-relaxed mb-6">{message}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-colors"
    >
      <RefreshCw size={16} />
      Try Again
    </button>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-to-top button (shown when user isn't visible in viewport)
// ─────────────────────────────────────────────────────────────────────────────

const ScrollToUserBtn = ({ onClick }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    onClick={onClick}
    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xl shadow-violet-600/30 hover:bg-violet-700 transition-colors"
  >
    <ChevronUp size={16} />
    Jump to your rank
  </motion.button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const LeaderboardPage = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [top3, setTop3] = useState([]);
  const [currentUserEntry, setCurrentUserEntry] = useState(null);
  const [isInTop3, setIsInTop3] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // ── Determine the current user's ID from AuthContext ──────────────────────
  const currentUserId = useMemo(() => {
    if (!currentUser) return null;
    return String(
      currentUser.id ??
        currentUser.user_id ??
        currentUser.userId ??
        currentUser.username ??
        ""
    );
  }, [currentUser]);

  // ── Fetch leaderboard data ────────────────────────────────────────────────
  const load = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await fetchLeaderboard();
      setEntries(data.entries);
      setTop3(data.top3);
      // isInTop3 comes directly from backend personal_stats.is_in_top_3
      // Never manually inject current user into podium
      setIsInTop3(data.isInTop3 ?? false);
      // currentUserEntry is used for summary cards only (rank/points/quizzes)
      const serviceCurrentUser = data.currentUser;
      if (serviceCurrentUser) {
        setCurrentUserEntry(serviceCurrentUser);
      } else if (currentUserId) {
        const found =
          data.entries.find((e) => e.userId === currentUserId) ??
          data.entries.find(
            (e) =>
              e.username?.toLowerCase() ===
              (currentUser?.username ?? "").toLowerCase()
          ) ??
          null;
        setCurrentUserEntry(found);
      }
    } catch (err) {
      setApiError(
        err?.response?.data?.detail ??
          err?.response?.data?.message ??
          "Failed to load the leaderboard. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Show "jump to rank" button when user is far down the list ────────────
  useEffect(() => {
    if (!currentUserEntry) return;
    const threshold = 10; // show button if user is beyond rank 10
    setShowScrollBtn(currentUserEntry.rank > threshold);
  }, [currentUserEntry]);

  const scrollToUser = () => {
    const el = document.getElementById(`lb-row-${currentUserEntry?.userId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ── Derive "my stats" for summary cards ──────────────────────────────────
  const derivedUserEntry = useMemo(() => {
    if (currentUserEntry) return currentUserEntry;
    if (!currentUserId || entries.length === 0) return null;
    return (
      entries.find((e) => e.userId === currentUserId) ??
      entries.find(
        (e) =>
          e.username?.toLowerCase() ===
          (currentUser?.username ?? "").toLowerCase()
      ) ??
      null
    );
  }, [currentUserEntry, currentUserId, entries, currentUser]);

  const myRank = derivedUserEntry?.rank ?? null;
  const myPoints = derivedUserEntry?.points ?? 0;
  const myQuizzes = derivedUserEntry?.quizzesCompleted ?? 0;

  // ── Check if a row belongs to the current user ───────────────────────────
  const isCurrentUserRow = (entry) => {
    if (!currentUserId) return false;
    if (entry.userId === currentUserId) return true;
    if (
      entry.username?.toLowerCase() ===
      (currentUser?.username ?? "").toLowerCase()
    )
      return true;
    return false;
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Trophy size={22} className="text-amber-500" />
          </div>
          <div>
            <h1 className="font-space-grotesk text-2xl font-bold text-app leading-tight">
              Leaderboard
            </h1>
            <p className="text-sm text-app-muted">
              Ranked by total points · 1 correct answer = 1 point
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : apiError ? (
        /* ── Error ────────────────────────────────────────────────────────── */
        <ErrorState message={apiError} onRetry={load} />
      ) : (
        <>
          {/* ── Summary Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              icon={Trophy}
              label="Your Rank"
              value={
                myRank === null
                  ? "Not Ranked"
                  : `${myRank}${rankSuffix(myRank)}`
              }
              gradient="bg-gradient-to-br from-amber-500 to-yellow-400 text-white"
              iconBg="bg-white/20"
              delay={0.05}
            />
            <SummaryCard
              icon={Star}
              label="Your Points"
              value={formatPoints(myPoints)}
              gradient="bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white"
              iconBg="bg-white/20"
              delay={0.1}
            />
            <SummaryCard
              icon={BookOpen}
              label="Quizzes Completed"
              value={myQuizzes}
              gradient="bg-gradient-to-br from-sky-500 to-cyan-400 text-white"
              iconBg="bg-white/20"
              delay={0.15}
              onClick={() => navigate("/attempts")}
            />
          </div>

          {/* ── Podium ────────────────────────────────────────────────────── */}
          {top3.length >= 1 && (
            <Podium
              top3={top3}
              isInTop3={isInTop3}
              currentUserId={currentUserId}
            />
          )}

          {/* ── Table ─────────────────────────────────────────────────────── */}
          {entries.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="overflow-hidden">
                {/* Table header */}
                <div className="flex items-center px-6 py-4 border-b border-app">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-violet-600 dark:text-violet-400" />
                    <h2 className="font-space-grotesk font-bold text-app">
                      All Rankings
                    </h2>
                    <span className="ml-1 text-xs font-medium surface-elev text-app-muted rounded-full px-2.5 py-0.5">
                      {entries.length} players
                    </span>
                  </div>
                </div>

                {/* Responsive table wrapper */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse">
                    <thead>
                      <tr className="surface-subtle text-left">
                        <th className="py-3 pl-4 pr-3 text-[11px] font-semibold uppercase tracking-wider text-app-muted">
                          Rank
                        </th>
                        <th className="py-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-app-muted">
                          Player
                        </th>

                        <th className="py-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-app-muted text-right">
                          Points
                        </th>
                        <th className="py-3 pr-5 text-[11px] font-semibold uppercase tracking-wider text-app-muted text-right">
                          Quizzes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {entries.map((entry, idx) => (
                        <TableRow
                          key={entry.userId}
                          id={`lb-row-${entry.userId}`}
                          entry={entry}
                          isCurrentUser={isCurrentUserRow(entry)}
                          index={idx}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table footer */}
                <div className="px-6 py-4 border-t border-app surface-subtle text-xs text-app-muted text-center">
                  Rankings update in real-time · 1 correct answer = 1 point
                </div>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* ── Scroll-to-user floating button ────────────────────────────────── */}
      <AnimatePresence>
        {showScrollBtn && !isLoading && (
          <ScrollToUserBtn onClick={scrollToUser} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaderboardPage;
