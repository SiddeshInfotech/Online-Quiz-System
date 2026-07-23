import { motion } from "framer-motion";
import { Check, Lock, Sparkles } from "lucide-react";
import Card from "../ui/Card/Card";
import Button from "../ui/Button/Button";
import ProgressBar from "./ProgressBar";
import { Link } from "react-router-dom";

const rarityColors = {
  Common: "surface-elev text-app-2 border-app",
  Rare: "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  Epic: "bg-fuchsia-50 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-500/30",
  Legendary: "bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
};

const BadgeCard = ({ badge, onClaim, className = "" }) => {
  if (!badge) return null;

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
  } = badge;

  // Requirement 2: Strict backend status logic only
  const isLocked = is_unlocked === false;
  const isClaimable = is_unlocked === true && is_claimed === false;
  const isClaimed = is_claimed === true;

  // Card styles
  const cardStyle = isClaimable
    ? "ring-2 ring-violet-400 ring-offset-2 shadow-lg shadow-violet-200/50"
    : "border-app";

  return (
    <Link to={`/badges/${badge_id}`} className={`block h-full ${className}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-full"
      >
        <Card className={`h-full p-5 flex flex-col relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-violet-100/50 ${cardStyle} ${isLocked ? 'opacity-80' : ''}`}>
          
          {/* Rarity Chip */}
          <div className="absolute top-4 right-4 z-10">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${rarityColors[rarity] || rarityColors.Common}`}>
              {rarity}
            </span>
          </div>

          {/* Top Section: Image & Title */}
          <div className="flex gap-4 items-start pr-16">
            <div className="relative shrink-0">
              {icon_url ? (
                <img
                  src={icon_url}
                  alt={badge_name}
                  className={`w-16 h-16 object-cover rounded-2xl border border-app shadow-sm ${isLocked ? "grayscale-[0.6] opacity-80" : ""}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(badge_name)}&backgroundColor=6D5EF9`;
                  }}
                />
              ) : (
                <div className={`w-16 h-16 surface-subtle rounded-2xl border border-app shadow-sm ${isLocked ? "grayscale-[0.6] opacity-80" : ""}`} />
              )}
              
              {/* Status Icons */}
              {isClaimed && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-[var(--bg-surface)]">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
              {isLocked && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 surface-subtle text-app-muted rounded-full flex items-center justify-center shadow-md border-2 border-app">
                  <Lock size={12} strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="flex flex-col pt-1">
              <h3 className="font-bold text-app group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug">
                {badge_name}
              </h3>
              {xp_reward !== undefined && xp_reward !== null && (
                <div className="text-xs font-medium text-violet-600 mt-1.5 flex items-center gap-1">
                  <Sparkles size={12} />
                  +{xp_reward} XP
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <p className="text-sm text-app-muted line-clamp-2">
              {description}
            </p>
          </div>

          {/* Bottom Section: Progress & Requirement */}
          <div className="mt-auto pt-5">
            {isClaimable ? (
              <Button
                variant="primary"
                className="w-full justify-center shadow-md shadow-violet-500/20 animate-pulse"
                onClick={(e) => {
                  e.preventDefault();
                  if (onClaim) onClaim(badge);
                }}
              >
                Claim Reward
              </Button>
            ) : (
              <div className="flex flex-col">
                <ProgressBar 
                  current={current_progress} 
                  total={required_target || 1} 
                  percentage={progress_percentage}
                  color={isClaimed ? "emerald" : "violet"}
                />
              </div>
            )}
          </div>

        </Card>
      </motion.div>
    </Link>
  );
};

export default BadgeCard;

