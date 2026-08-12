import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, X } from "lucide-react";

/**
 * Fast & responsive full-screen celebratory animation shown after a badge is claimed.
 */
const RARITY_GLOW = {
  COMMON: ["#94a3b8", "#64748b"],
  RARE: ["#3B82F6", "#1E3A8A"],
  EPIC: ["#A855F7", "#6D28D9"],
  LEGENDARY: ["#F5C451", "#B8860B"],
};

function ConfettiPiece({ i, colors }) {
  const left = `${(i * 137) % 100}%`;
  const delay = (i % 10) * 0.03;
  const color = colors[i % colors.length];
  const size = 6 + (i % 4) * 3;
  return (
    <motion.span
      aria-hidden
      initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
      animate={{ y: "105vh", rotate: 540, opacity: [1, 1, 0.8, 0] }}
      transition={{ duration: 1.2 + (i % 5) * 0.15, delay, ease: "easeOut" }}
      style={{
        position: "absolute",
        top: 0,
        left,
        width: size,
        height: size * 1.5,
        borderRadius: 2,
        background: color,
      }}
    />
  );
}

export default function BadgeCelebration({ isOpen, badge, xpEarned, onClose }) {
  const [imgFailed, setImgFailed] = useState(false);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const colors = useMemo(
    () => RARITY_GLOW[badge?.rarity] || RARITY_GLOW.COMMON,
    [badge]
  );

  // Auto-dismiss after 4.5s
  useEffect(() => {
    if (!isOpen) return;
    setImgFailed(false);
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [isOpen, onClose]);

  if (!isOpen || !badge) return null;

  const rays = Array.from({ length: 12 });
  const confetti = reduce ? [] : Array.from({ length: 45 });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* Dim + blur backdrop */}
        <div
          className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
          onClick={onClose}
        />

        {/* Radial glow behind the badge */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(40% 40% at 50% 45%, ${colors[0]}55, transparent 70%)`,
          }}
        />

        {/* Confetti layer */}
        <div className="absolute inset-0 pointer-events-none">
          {confetti.map((_, i) => (
            <ConfettiPiece key={i} i={i} colors={colors} />
          ))}
        </div>

        {/* Rotating rays */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute pointer-events-none"
            style={{ width: 500, height: 500 }}
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: 360, opacity: 0.3 }}
            transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.3 } }}
          >
            {rays.map((_, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 4,
                  height: 250,
                  transformOrigin: "top center",
                  transform: `translate(-50%,0) rotate(${(360 / rays.length) * i}deg)`,
                  background: `linear-gradient(${colors[0]}, transparent)`,
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Badge card */}
        <motion.div
          className="relative z-10 flex flex-col items-center px-8 text-center"
          initial={{ scale: 0.6, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 350 }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute -top-2 right-0 p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={22} />
          </button>

          <motion.p
            className="mb-3 flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-white/80"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Sparkles size={16} /> Achievement Claimed!
          </motion.p>

          <motion.div
            className="mb-5 h-36 w-36 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.08, damping: 14, stiffness: 380 }}
          >
            {badge.icon_url || badge.image_url ? (
              <img
                src={badge.icon_url || badge.image_url}
                alt={badge.name || "Badge"}
                className="h-full w-full object-contain"
                onError={() => setImgFailed(true)}
              />
            ) : imgFailed ? (
              <div className="grid h-full w-full place-items-center rounded-full bg-white/10 text-amber-400">
                <Trophy size={60} />
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center rounded-full bg-white/10 text-amber-400">
                <Trophy size={60} />
              </div>
            )}
          </motion.div>

          <motion.h2
            className="font-space-grotesk text-2xl sm:text-3xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
          >
            {badge.name}
          </motion.h2>
          <motion.p
            className="mt-1 max-w-xs text-xs sm:text-sm text-white/70 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
          >
            {badge.description}
          </motion.p>

          <motion.div
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-bold text-white shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, damping: 12 }}
          >
            <Sparkles size={18} style={{ color: colors[0] }} />
            +{xpEarned} XP
          </motion.div>

          <button
            onClick={onClose}
            className="mt-6 rounded-xl bg-white px-8 py-2.5 font-bold text-slate-900 shadow-md transition hover:scale-105 active:scale-95 cursor-pointer text-sm"
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
