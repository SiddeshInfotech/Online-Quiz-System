import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import achievementService from "../../services/achievementService";
import BadgeStats from "../../components/achievements/BadgeStats";
import BadgeCategory from "../../components/achievements/BadgeCategory";
import BadgeFilters from "../../components/achievements/BadgeFilters";
import ClaimModal from "../../components/achievements/ClaimModal";
import BadgeCelebration from "../../components/achievements/BadgeCelebration";
import SkeletonBadge from "../../components/achievements/SkeletonBadge";
import EmptyState from "../../components/achievements/EmptyState";
import BadgeCard from "../../components/achievements/BadgeCard";
import BadgeGrid from "../../components/achievements/BadgeGrid";
import { resolveMediaUrl } from "../../services/api";

const FILTERS = ["All", "Claimed", "Claimable", "Locked", "Common", "Rare", "Epic", "Legendary"];
const SORT_OPTIONS = ["Newest", "Progress", "XP", "Alphabetical", "Rarity"];

const AchievementPage = () => {
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Newest");

  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [celebration, setCelebration] = useState(null); // { badge, xpEarned }
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    try {
      const [fetchedBadges, fetchedStats, fetchedCategories] = await Promise.all([
        achievementService.getAllBadges(),
        achievementService.getUserStats(),
        achievementService.getCategories()
      ]);

      // Resolve media URLs
      const processedBadges = fetchedBadges.map(b => ({
        ...b,
        icon_url: resolveMediaUrl(b.icon_url || b.image_url),
        image_url: resolveMediaUrl(b.icon_url || b.image_url)
      }));

      setBadges(processedBadges);
      setStats(fetchedStats);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Failed to load achievements", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleGamificationRefresh = () => {
      loadData();
    };

    window.addEventListener("app:refresh-gamification", handleGamificationRefresh);
    return () => window.removeEventListener("app:refresh-gamification", handleGamificationRefresh);
  }, []);

  const handleClaim = async (badge) => {
    try {
      const badgeId = badge.badge_id || badge.id;
      const res = await achievementService.claimBadge(badgeId);

      showToast("Badge claimed successfully!");
      loadData();

      if (res && res.celebrate && res.badge) {
        setCelebration({
          badge: { ...res.badge, icon_url: resolveMediaUrl(res.badge.icon_url || res.badge.image_url) },
          xpEarned: res.xp_earned || res.badge?.xp_reward || 0,
        });
      } else {
        setSelectedBadge({ ...badge, ...res });
        setShowClaimModal(true);
      }
    } catch (error) {
      console.error("Failed to claim badge", error);
      showToast(error.message || "Could not claim badge. Please try again.");
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleModalClose = () => {
    setShowClaimModal(false);
    setSelectedBadge(null);
  };

  // Filtering & Sorting Logic per backend contract
  const filteredBadges = badges.filter(badge => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Claimed") return badge.is_claimed === true;
    if (activeFilter === "Claimable") return badge.is_unlocked === true && badge.is_claimed === false;
    if (activeFilter === "Locked") return badge.is_unlocked === false;

    return badge.rarity?.toUpperCase() === activeFilter.toUpperCase();
  });

  const sortedBadges = [...filteredBadges].sort((a, b) => {
    switch (activeSort) {
      case "Progress":
        return (b.progress_percentage ?? 0) - (a.progress_percentage ?? 0);
      case "XP":
        return (b.xp_reward ?? b.xp_earned ?? 0) - (a.xp_reward ?? a.xp_earned ?? 0);
      case "Alphabetical":
        return (a.badge_name || a.name || "").localeCompare(b.badge_name || b.name || "");
      case "Rarity":
        const rarityOrder = { LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
        return (rarityOrder[b.rarity?.toUpperCase()] || 0) - (rarityOrder[a.rarity?.toUpperCase()] || 0);
      case "Newest":
      default:
        const dateA = a.earned_at || a.claimed_at;
        const dateB = b.earned_at || b.claimed_at;
        if (dateA && dateB) {
          return new Date(dateB) - new Date(dateA);
        } else if (dateA) {
          return -1;
        } else if (dateB) {
          return 1;
        }
        return 0;
    }
  });

  const claimableBadges = badges.filter(b => b.is_unlocked === true && b.is_claimed === false);

  return (
    <div className="w-full max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-full font-medium shadow-lg border border-emerald-200">
          {toast}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
        <h1 className="text-3xl font-bold font-space-grotesk text-app mb-2">🏆 Achievements</h1>
        <p className="text-base text-app-muted">Complete challenges, earn badges, collect XP, and level up your learning journey.</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 surface-elev rounded-[20px] animate-pulse" />)}
        </div>
      ) : (
        <BadgeStats stats={stats} />
      )}

      {/* Claimable Section */}
      {!loading && claimableBadges.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-space-grotesk text-slate-800 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
              </span>
              Ready to Claim
            </h2>
          </div>
          <BadgeGrid>
            {claimableBadges.map(badge => (
              <BadgeCard key={badge.id} badge={badge} onClaim={handleClaim} />
            ))}
          </BadgeGrid>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-end items-center mb-8 surface p-4 rounded-2xl shadow-sm border border-app">
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <span className="text-sm font-medium text-app-muted shrink-0">Sort by:</span>
          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            className="surface-subtle border border-app text-app-2 text-sm rounded-xl focus:ring-violet-500 focus:border-violet-500 block p-2.5 outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <BadgeFilters filters={FILTERS} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Categories */}
      {loading ? (
        <BadgeGrid>
          {[1, 2, 3, 4].map(i => <SkeletonBadge key={i} />)}
        </BadgeGrid>
      ) : sortedBadges.length > 0 ? (
        <div>
          {categories.map(category => {
            const categoryName = category.name || category;
            const categoryBadges = sortedBadges.filter(b => b.category === categoryName);
            return <BadgeCategory key={categoryName} category={categoryName} badges={categoryBadges} onClaim={handleClaim} />
          })}

          {/* Catch-all for badges without a known category */}
          {(() => {
            const unknownBadges = sortedBadges.filter(b => !categories.some(c => (c.name || c) === b.category));
            if (unknownBadges.length > 0) {
              return <BadgeCategory category="Other" badges={unknownBadges} onClaim={handleClaim} />
            }
            return null;
          })()}
        </div>
      ) : (
        <EmptyState message="No badges found for selected filters." />
      )}

      <ClaimModal isOpen={showClaimModal} badge={selectedBadge} onClose={handleModalClose} />
      <BadgeCelebration
        isOpen={!!celebration}
        badge={celebration?.badge}
        xpEarned={celebration?.xpEarned}
        onClose={() => { setCelebration(null); showToast("Badge claimed!"); }}
      />
    </div>
  );
};

export default AchievementPage;
