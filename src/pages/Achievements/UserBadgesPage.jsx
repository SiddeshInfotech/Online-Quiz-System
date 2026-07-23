import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import achievementService from "../../services/achievementService";
import BadgeCard from "../../components/achievements/BadgeCard";
import BadgeGrid from "../../components/achievements/BadgeGrid";
import BadgeFilters from "../../components/achievements/BadgeFilters";
import EmptyState from "../../components/achievements/EmptyState";
import SkeletonBadge from "../../components/achievements/SkeletonBadge";
import { resolveMediaUrl } from "../../services/api";

const FILTERS = ["All", "Common", "Rare", "Epic", "Legendary"];
const SORT_OPTIONS = ["Newest", "XP", "Alphabetical", "Rarity"];

const UserBadgesPage = () => {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Newest");

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const data = await achievementService.getAllBadges();
        // Only show claimed badges on the user badges page
        const earned = data
          .filter(b => b.is_claimed === true)
          .map(b => ({ ...b, icon_url: resolveMediaUrl(b.icon_url || b.image_url) }));
        setBadges(earned);
      } catch (error) {
        console.error("Failed to fetch badges", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();

    const handleGamificationRefresh = () => {
      fetchBadges();
    };

    window.addEventListener("app:refresh-gamification", handleGamificationRefresh);
    return () => window.removeEventListener("app:refresh-gamification", handleGamificationRefresh);
  }, []);

  const filteredBadges = badges.filter(badge => {
    if (activeFilter === "All") return true;
    return badge.rarity?.toUpperCase() === activeFilter.toUpperCase();
  });

  const sortedBadges = [...filteredBadges].sort((a, b) => {
    switch (activeSort) {
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
        }
        return 0;
    }
  });

  return (
    <div className="w-full max-w-7xl mx-auto pb-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-app-muted hover:text-violet-600 font-medium mb-8 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-space-grotesk text-app mb-2">My Badges</h1>
        <p className="text-base text-app-muted">
          You have claimed <span className="font-bold text-violet-600">{badges.length}</span> badges so far.
        </p>
      </div>

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

      {loading ? (
        <BadgeGrid>
          {[1,2,3,4,5,6,7,8].map(i => <SkeletonBadge key={i} />)}
        </BadgeGrid>
      ) : sortedBadges.length > 0 ? (
        <BadgeGrid>
          {sortedBadges.map(badge => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </BadgeGrid>
      ) : (
        <EmptyState message="No claimed badges found for selected filters." />
      )}
    </div>
  );
};

export default UserBadgesPage;
