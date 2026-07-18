import { motion } from "framer-motion";
import { Check, Lock, Sparkles } from "lucide-react";
import Card from "../ui/Card/Card";
import Button from "../ui/Button/Button";
import ProgressBar from "./ProgressBar";
import { Link } from "react-router-dom";

const rarityColors = {
  Common: "bg-slate-100 text-slate-600 border-slate-200",
  Rare: "bg-blue-50 text-blue-600 border-blue-200",
  Epic: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
  Legendary: "bg-amber-50 text-amber-600 border-amber-200",
};

const BadgeCard = ({ badge, onClaim, className = "" }) => {
  const {
    id,
    name,
    description,
    image_url,
    rarity = "Common",
    xp_reward,
    progress = 0,
    target = 1,
    requirement,
    status = "LOCKED",
  } = badge;

  const isLocked = status === "LOCKED";
  const isClaimable = status === "CLAIMABLE";
  const isClaimed = status === "CLAIMED";

  // Card styles
  const cardStyle = isClaimable
    ? "ring-2 ring-violet-400 ring-offset-2 shadow-lg shadow-violet-200/50"
    : "border-slate-200";

  return (
    <Link to={`/badges/${id}`} className={`block h-full ${className}`}>
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
              {image_url ? (
                <img
                  src={image_url}
                  alt={name}
                  className={`w-16 h-16 object-cover rounded-2xl border border-slate-200 shadow-sm ${isLocked ? "grayscale-[0.6] opacity-80" : ""}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=6D5EF9`;
                  }}
                />
              ) : (
                <div className={`w-16 h-16 bg-slate-200 rounded-2xl border border-slate-200 shadow-sm ${isLocked ? "grayscale-[0.6] opacity-80" : ""}`} />
              )}
              
              {/* Status Icons */}
              {isClaimed && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
              {isLocked && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                  <Lock size={12} strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="flex flex-col pt-1">
              <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug">
                {name}
              </h3>
              <div className="text-xs font-medium text-violet-600 mt-1.5 flex items-center gap-1">
                <Sparkles size={12} />
                +{xp_reward} XP
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <p className="text-sm text-slate-500 line-clamp-2">
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
                  current={progress} 
                  total={target || 1} 
                  color={isClaimed ? "emerald" : "violet"}
                />
                {(requirement || badge.requirement) && (
                  <p className="text-xs text-slate-400 line-clamp-2 mt-2">
                    {requirement || badge.requirement}
                  </p>
                )}
              </div>
            )}
          </div>

        </Card>
      </motion.div>
    </Link>
  );
};

export default BadgeCard;

