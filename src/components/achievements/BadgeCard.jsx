import { motion } from "framer-motion";
import { Check, Lock, Sparkles } from "lucide-react";
import Card from "../ui/Card/Card";
import Button from "../ui/Button/Button";
import ProgressBar from "./ProgressBar";
import { Link } from "react-router-dom";

const rarityColors = {
  Common: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
  Rare: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Epic: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
  Legendary: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/10",
};

const BadgeCard = ({ badge, onClaim, className = "" }) => {
  if (!badge) return null;

  const {
    badge_id = badge.id,
    badge_name = badge.name || badge.title || "Achievement",
    description = badge.description || badge.requirement || "Complete tasks to unlock",
    icon_url = badge.image_url,
    category,
    rarity = "Common",
    xp_reward = badge.xp_reward ?? badge.xp_earned ?? 10,
    current_progress = badge.current_progress ?? badge.progress ?? 0,
    required_target = badge.required_target ?? badge.target ?? 1,
    progress_percentage,
    is_unlocked,
    is_claimed,
  } = badge;

  // Strict backend status contract
  const isLocked = is_unlocked === false;
  const isClaimable = is_unlocked === true && is_claimed === false;
  const isClaimed = is_claimed === true;

  // Card outline styles for theme
  const cardStyle = isClaimable
    ? "border-violet-500/60 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30"
    : isClaimed
    ? "border-app"
    : "border-app opacity-90";

  return (
    <Link to={`/badges/${badge_id}`} className={`block h-full ${className}`}>
      <motion.div
        whileHover={{ y: -5, scale: 1.01 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="h-full"
      >
        <Card className={`h-full p-5 flex flex-col relative overflow-hidden surface rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:shadow-violet-600/15 hover:border-violet-500/40 ${cardStyle}`}>
          
          {/* Rarity Chip */}
          <div className="absolute top-4 right-4 z-10">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${rarityColors[rarity] || rarityColors.Common}`}>
              {rarity}
            </span>
          </div>

          {/* Top Section: Badge Icon & Title */}
          <div className="flex gap-4 items-start pr-16">
            <div className="relative shrink-0">
              <div className={`w-20 h-20 rounded-2xl p-1 bg-slate-100 dark:bg-slate-950 border border-app flex items-center justify-center shadow-inner relative overflow-hidden ${isLocked ? 'grayscale opacity-75' : ''}`}>
                {icon_url ? (
                  <img
                    src={icon_url}
                    alt={badge_name}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(badge_name)}&backgroundColor=6D5EF9`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full surface-subtle rounded-xl flex items-center justify-center text-app-muted font-bold text-xl">
                    🏆
                  </div>
                )}
              </div>

              {/* Status Badge Overlay */}
              {isClaimed && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-app font-extrabold">
                  <Check size={14} strokeWidth={3.5} />
                </div>
              )}
              {isLocked && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center shadow-md border-2 border-app">
                  <Lock size={12} strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="flex flex-col pt-1 min-w-0">
              <h3 className="font-bold font-space-grotesk text-base text-app group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2 leading-snug">
                {badge_name}
              </h3>
              
              {xp_reward !== undefined && xp_reward !== null && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-violet-600 dark:text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 rounded-lg w-max">
                  <Sparkles size={12} className="text-violet-600 dark:text-violet-400" />
                  +{xp_reward} XP
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-3.5 mb-4 flex-1">
            <p className="text-xs text-app-muted line-clamp-2 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Bottom Section: Progress & Action Button */}
          <div className="mt-auto space-y-3 pt-2">
            <ProgressBar 
              current={current_progress} 
              total={required_target || 1} 
              percentage={progress_percentage}
              color={isClaimed ? "emerald" : "violet"}
              isCompleted={isClaimed || isClaimable}
            />

            {/* Requirement 5 Buttons */}
            {isClaimable ? (
              <Button
                variant="primary"
                className="w-full justify-center text-xs font-bold py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-violet-600/30 border border-violet-400/30 animate-pulse"
                onClick={(e) => {
                  e.preventDefault();
                  if (onClaim) onClaim(badge);
                }}
              >
                <Sparkles size={14} className="mr-1.5" />
                Claim +{xp_reward} XP
              </Button>
            ) : isClaimed ? (
              <div className="w-full py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                <Check size={14} strokeWidth={3} />
                Claimed ✓
              </div>
            ) : (
              <div className="w-full py-2 bg-slate-100 dark:bg-slate-800/80 border border-app text-app-muted text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5">
                <Lock size={12} />
                Locked
              </div>
            )}
          </div>

        </Card>
      </motion.div>
    </Link>
  );
};

export default BadgeCard;
