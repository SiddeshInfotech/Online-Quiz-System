import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import achievementService from "../../services/achievementService";
import BadgeStats from "../../components/achievements/BadgeStats";
import BadgeCategory from "../../components/achievements/BadgeCategory";
import BadgeFilters from "../../components/achievements/BadgeFilters";
import ClaimModal from "../../components/achievements/ClaimModal";
import SkeletonBadge from "../../components/achievements/SkeletonBadge";
import EmptyState from "../../components/achievements/EmptyState";
import BadgeCard from "../../components/achievements/BadgeCard";
import BadgeGrid from "../../components/achievements/BadgeGrid";
import Input from "../../components/ui/Input/Input";
import { resolveMediaUrl } from "../../services/api";

const FILTERS = ["All", "Claimed", "Claimable", "Locked", "Common", "Rare", "Epic", "Legendary"];
const SORT_OPTIONS = ["Newest", "Progress", "XP", "Alphabetical", "Rarity"];

const AchievementPage = () => {
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Newest");
  
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
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
        image_url: resolveMediaUrl(b.image_url)
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
  }, []);

  const handleClaim = async (badge) => {
    try {
      const updatedBadge = await achievementService.claimBadge(badge.id);
      
      // Update local state
      setBadges(prev => prev.map(b => b.id === updatedBadge.id ? { ...updatedBadge, image_url: resolveMediaUrl(updatedBadge.image_url) } : b));
      
      // Fetch fresh stats
      const freshStats = await achievementService.getUserStats();
      setStats(freshStats);
      
      setSelectedBadge(updatedBadge);
      setShowClaimModal(true);
      
    } catch (error) {
      console.error("Failed to claim badge", error);
      // Could show error toast here
    }
  };
  
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleModalClose = () => {
    setShowClaimModal(false);
    setSelectedBadge(null);
    showToast("Badge claimed successfully!");
  };

  // Filtering & Sorting Logic
  const filteredBadges = badges.filter(badge => {
    // Search
    if (searchQuery && !badge.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Filter
    if (activeFilter === "All") return true;
    if (activeFilter === "Claimed") return badge.status === "CLAIMED";
    if (activeFilter === "Claimable") return badge.status === "CLAIMABLE";
    if (activeFilter === "Locked") return badge.status === "LOCKED";
    
    return badge.rarity?.toUpperCase() === activeFilter.toUpperCase();
  });

  const sortedBadges = [...filteredBadges].sort((a, b) => {
    switch (activeSort) {
      case "Progress":
        const progressA = (a.target > 0) ? (a.progress / a.target) : 0;
        const progressB = (b.target > 0) ? (b.progress / b.target) : 0;
        return progressB - progressA;
      case "XP":
        return b.xp_reward - a.xp_reward;
      case "Alphabetical":
        return a.name.localeCompare(b.name);
      case "Rarity":
        const rarityOrder = { LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
        return (rarityOrder[b.rarity?.toUpperCase()] || 0) - (rarityOrder[a.rarity?.toUpperCase()] || 0);
      case "Newest":
      default:
        if (a.claimed_at && b.claimed_at) {
          return new Date(b.claimed_at) - new Date(a.claimed_at);
        } else if (a.claimed_at) {
          return -1;
        } else if (b.claimed_at) {
          return 1;
        }
        return 0; // fallback if no date
    }
  });

  const claimableBadges = badges.filter(b => b.status === "CLAIMABLE");

  return (
    <div className="w-full max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-full font-medium shadow-lg border border-emerald-200">
          {toast}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
        <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 mb-2">🏆 Achievements</h1>
        <p className="text-base text-slate-500">Complete challenges, earn badges, collect XP, and level up your learning journey.</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 bg-slate-100 rounded-[20px] animate-pulse" />)}
        </div>
      ) : (
        <BadgeStats stats={stats} totalBadges={badges.length} />
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-full md:w-72">
          <Input 
            name="search"
            placeholder="Search badges..." 
            leftIcon={Search} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-0 border-slate-200 bg-slate-50"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <span className="text-sm font-medium text-slate-500 shrink-0">Sort by:</span>
          <select 
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-violet-500 focus:border-violet-500 block p-2.5 outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <BadgeFilters filters={FILTERS} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Categories */}
      {loading ? (
        <BadgeGrid>
          {[1,2,3,4].map(i => <SkeletonBadge key={i} />)}
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
        <EmptyState message={`No badges found for "${searchQuery}" or selected filters.`} />
      )}

      <ClaimModal isOpen={showClaimModal} badge={selectedBadge} onClose={handleModalClose} />
    </div>
  );
};

export default AchievementPage;
