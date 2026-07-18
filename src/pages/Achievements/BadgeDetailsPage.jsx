import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Trophy, Calendar, Target, BookOpen, Clock } from "lucide-react";
import achievementService from "../../services/achievementService";
import Button from "../../components/ui/Button/Button";
import Card from "../../components/ui/Card/Card";
import ProgressBar from "../../components/achievements/ProgressBar";
import { resolveMediaUrl } from "../../services/api";

const rarityColors = {
  Common: "bg-slate-100 text-slate-600 border-slate-200",
  Rare: "bg-blue-50 text-blue-600 border-blue-200",
  Epic: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
  Legendary: "bg-amber-50 text-amber-600 border-amber-200",
};

const BadgeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadge = async () => {
      try {
        const badges = await achievementService.getAllBadges();
        const data = badges.find(b => String(b.id) === String(id));
        if (!data) throw new Error("Badge not found");
        setBadge({
          ...data,
          image_url: resolveMediaUrl(data.image_url)
        });
      } catch (error) {
        console.error("Failed to load badge details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBadge();
  }, [id]);

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
    name,
    description,
    image_url,
    category,
    rarity = "Common",
    xp_reward,
    progress = 0,
    target = 1,
    requirement,
    status = "locked",
    claimed_at
  } = badge;

  const isClaimed = status === "CLAIMED";
  const isLocked = status === "LOCKED";

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-violet-600 font-medium mb-8 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <Card className="overflow-hidden bg-white shadow-xl border-slate-100 rounded-3xl">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-violet-600 to-fuchsia-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          {/* Large blurred background image for aesthetic */}
          {image_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-150"
              style={{ backgroundImage: `url(${image_url})` }}
            />
          )}
        </div>

        <div className="px-8 pb-12 relative">
          {/* Main Badge Icon */}
          <div className="relative -mt-24 mb-6 flex justify-center sm:justify-start">
            <div className={`w-40 h-40 bg-white rounded-[32px] p-6 shadow-2xl border-4 border-white flex items-center justify-center ${isLocked ? 'grayscale opacity-75' : ''}`}>
              {image_url ? (
                <img 
                  src={image_url} 
                  alt={name} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=6D5EF9`;
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
              <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 mb-3">{name}</h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">{description}</p>
              
              <div className="mb-8">
                <ProgressBar current={progress} total={target || 1} color={isClaimed ? "emerald" : "violet"} />
                {isClaimed && claimed_at && (
                  <p className="text-sm font-medium text-emerald-600 mt-3 flex items-center gap-2">
                    <Calendar size={16} /> Claimed on {new Date(claimed_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Related Quizzes Mock Section */}
              <div className="border-t border-slate-100 pt-8 mt-8">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-violet-600" /> Related Quizzes to Claim This
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-violet-200 transition-colors cursor-pointer group">
                      <h4 className="font-semibold text-slate-700 group-hover:text-violet-700 text-sm mb-1">General Knowledge Quiz #{i}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> 10 mins • 20 Qs</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar Stats */}
            <div className="w-full sm:w-64 shrink-0 flex flex-col gap-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">XP Reward</p>
                <div className="text-2xl font-bold text-violet-600 flex items-center gap-2">
                  <Sparkles size={20} /> +{xp_reward}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                <div className="text-lg font-bold text-slate-700 flex items-center gap-2">
                  <Target size={18} className="text-slate-400" /> {category}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Requirement</p>
                <div className="text-sm font-medium text-slate-700">
                  {progress} / {target || 1} completed
                </div>
                {(requirement || badge.requirement) && (
                  <p className="text-xs text-slate-500 mt-2">{requirement || badge.requirement}</p>
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
