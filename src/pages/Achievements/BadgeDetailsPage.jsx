import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Trophy, Calendar, Target, BookOpen, Clock } from "lucide-react";
import achievementService from "../../services/achievementService";
import Button from "../../components/ui/Button/Button";
import Card from "../../components/ui/Card/Card";
import ProgressBar from "../../components/achievements/ProgressBar";
import { resolveMediaUrl } from "../../services/api";

const rarityColors = {
  Common: "surface-elev text-app-2 border-app",
  Rare: "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  Epic: "bg-fuchsia-50 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-500/30",
  Legendary: "bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
};

const BadgeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchBadge = async () => {
    try {
      const badges = await achievementService.getAllBadges();
      const data = badges.find(b => String(b.badge_id || b.id) === String(id));
      if (!data) throw new Error("Badge not found");
      setBadge({
        ...data,
        icon_url: resolveMediaUrl(data.icon_url || data.image_url)
      });
    } catch (error) {
      console.error("Failed to load badge details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadge();

    const handleGamificationRefresh = () => {
      fetchBadge();
    };

    window.addEventListener("app:refresh-gamification", handleGamificationRefresh);
    return () => window.removeEventListener("app:refresh-gamification", handleGamificationRefresh);
  }, [id]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleClaim = async () => {
    if (!badge) return;
    try {
      setClaimLoading(true);
      const badgeId = badge.badge_id || badge.id;
      await achievementService.claimBadge(badgeId);
      showToast("Badge claimed successfully!");
      await fetchBadge();
    } catch (error) {
      showToast(error.message || "Could not claim badge. Please try again.");
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!badge) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Badge not found</h2>
        <Button onClick={() => navigate(-1)} variant="secondary">Go Back</Button>
      </div>
    );
  }

  const {
    badge_id = badge.id,
    badge_name = badge.name,
    description = badge.requirement,
    icon_url = badge.image_url,
    category,
    rarity = "Common",
    xp_reward = badge.xp_earned,
    current_progress = badge.progress ?? 0,
    required_target = badge.target ?? 1,
    progress_percentage,
    is_unlocked,
    is_claimed,
    earned_at = badge.claimed_at,
  } = badge;

  const isLocked = is_unlocked === false;
  const isClaimable = is_unlocked === true && is_claimed === false;

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-3 rounded-full font-medium shadow-lg border border-slate-700 animate-fade-in">
          {toast}
        </div>
      )}

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-app-muted hover:text-violet-600 font-medium mb-8 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <Card className="overflow-hidden surface shadow-xl border-app rounded-3xl">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-violet-600 to-fuchsia-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          {icon_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-150"
              style={{ backgroundImage: `url(${icon_url})` }}
            />
          )}
        </div>

        <div className="px-8 pb-12 relative">
          {/* Main Badge Icon */}
          <div className="relative -mt-24 mb-6 flex justify-center sm:justify-start">
            <div className={`w-40 h-40 surface rounded-[32px] p-6 shadow-2xl border-4 border-app flex items-center justify-center ${isLocked ? 'grayscale opacity-75' : ''}`}>
              {icon_url ? (
                <img 
                  src={icon_url} 
                  alt={badge_name} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(badge_name)}&backgroundColor=6D5EF9`;
                  }}
                />
              ) : (
                <Trophy size={64} className="text-slate-300" />
              )}
            </div>
            
            {/* Floating Rarity Badge */}
            <div className={`absolute bottom-0 sm:-right-4 px-4 py-1.5 rounded-full font-bold text-sm tracking-wide shadow-lg border-2 border-white ${rarityColors[rarity] || rarityColors.Common}`}>
              {rarity}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            {/* Left Content */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold font-space-grotesk text-app mb-3">{badge_name}</h1>
              <p className="text-app-2 text-lg leading-relaxed mb-6">{description}</p>
              
              <div className="mb-8">
                <ProgressBar current={current_progress} total={required_target || 1} percentage={progress_percentage} color={is_claimed ? "emerald" : "violet"} />
                {is_claimed && earned_at && (
                  <p className="text-sm font-medium text-emerald-600 mt-3 flex items-center gap-2">
                    <Calendar size={16} /> Earned on {new Date(earned_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Claim Action */}
              {isClaimable && (
                <div className="mb-8 p-6 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-violet-900 dark:text-violet-300 text-lg">Badge Unlocked!</h3>
                    <p className="text-xs text-violet-700 dark:text-violet-400">Complete the requirements to claim your reward.</p>
                  </div>
                  <Button
                    variant="primary"
                    disabled={claimLoading}
                    onClick={handleClaim}
                    className="min-w-[140px] justify-center shadow-lg shadow-violet-500/20"
                  >
                    {claimLoading ? "Claiming..." : "Claim Badge"}
                  </Button>
                </div>
              )}

              {/* Related Quizzes Section */}
              <div className="border-t border-app pt-8 mt-8">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-violet-600" /> Related Quizzes to Claim This
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="surface-subtle rounded-xl p-4 border border-app hover:border-violet-200 transition-colors cursor-pointer group">
                      <h4 className="font-semibold text-app-2 group-hover:text-violet-700 text-sm mb-1">General Knowledge Quiz #{i}</h4>
                      <p className="text-xs text-app-muted flex items-center gap-1"><Clock size={12}/> 10 mins • 20 Qs</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar Stats */}
            <div className="w-full sm:w-64 shrink-0 flex flex-col gap-4">
              {xp_reward !== undefined && xp_reward !== null && (
                <div className="surface-subtle rounded-2xl p-5 border border-app">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">XP Reward</p>
                  <div className="text-2xl font-bold text-violet-600 flex items-center gap-2">
                    <Sparkles size={20} /> +{xp_reward}
                  </div>
                </div>
              )}

              <div className="surface-subtle rounded-2xl p-5 border border-app">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                <div className="text-lg font-bold text-app-2 flex items-center gap-2">
                  <Target size={18} className="text-slate-400" /> {category}
                </div>
              </div>

              <div className="surface-subtle rounded-2xl p-5 border border-app">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Requirement Progress</p>
                <div className="text-sm font-medium text-app-2">
                  {current_progress} / {required_target || 1} completed
                </div>
                {progress_percentage !== undefined && (
                  <p className="text-xs text-violet-600 font-bold mt-1">{progress_percentage}% completed</p>
                )}
                {description && (
                  <p className="text-xs text-app-muted mt-2">{description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BadgeDetailsPage;
