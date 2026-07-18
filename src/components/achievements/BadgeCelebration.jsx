import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, X } from "lucide-react";

/**
 * Full-screen celebratory animation shown after a badge is claimed (#17).
 * Driven by the backend claim response ({ celebrate, badge, xp_earned }).
 * Respects prefers-reduced-motion.
 */
const RARITY_GLOW = {
  COMMON: ["#94a3b8", "#64748b"],
  RARE: ["#3B82F6", "#1E3A8A"],
  EPIC: ["#A855F7", "#6D28D9"],
  LEGENDARY: ["#F5C451", "#B8860B"],
};

function ConfettiPiece({ i, colors }) {
  const left = `${(i * 137) % 100}%`;
  const delay = (i % 10) * 0.06;
  const color = colors[i % colors.length];
  const size = 6 + (i % 4) * 3;
  return (
    <motion.span
      aria-hidden
      initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
      animate={{ y: "105vh", rotate: 720, opacity: [1, 1, 0.9, 0] }}
      transition={{ duration: 2.4 + (i % 5) * 0.25, delay, ease: "easeIn" }}
      style={{
        position: "absolute",
        top: 0,
        left,
        width: size,
        height: size * 1.6,
        borderRadius: 2,
        background: color,
      }}
    />
  );
}

export default function BadgeCelebration({ isOpen, badge, xpEarned, onClose }) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const colors = useMemo(
    () => RARITY_GLOW[badge?.rarity] || RARITY_GLOW.COMMON,
    [badge]
  );

  // Auto-dismiss after a few seconds so it never blocks the user.
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [isOpen, onClose]);

  if (!isOpen || !badge) return null;

  const rays = Array.from({ length: 12 });
  const confetti = reduce ? [] : Array.from({ length: 60 });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dim + blur backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Radial glow behind the badge */}
        <div
          aria-hidden
          className="absolute inset-0"
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
            className="absolute"
            style={{ width: 520, height: 520 }}
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: 360, opacity: 0.25 }}
            transition={{ rotate: { duration: 18, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.6 } }}
          >
            {rays.map((_, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 4,
                  height: 260,
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
          initial={{ scale: 0.4, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", damping: 14, stiffness: 220 }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute -top-2 right-0 p-2 text-white/70 hover:text-white"
          >
            <X size={22} />
          </button>

          <motion.p
            className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/80"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles size={16} /> Achievement claimed
          </motion.p>

          <motion.div
            className="mb-6 h-40 w-40 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.15, damping: 10 }}
          >
            {badge.image_url ? (
              <img
                src={badge.image_url}
                alt={badge.name}
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                    badge.name
                  )}&backgroundColor=6D5EF9`;
                }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center rounded-full bg-white/10 text-white">
                <Trophy size={56} />
              </div>
            )}
          </motion.div>

          <motion.h2
            className="font-space-grotesk text-3xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {badge.name}
          </motion.h2>
          <motion.p
            className="mt-1 max-w-xs text-sm text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            {badge.description}
          </motion.p>

          <motion.div
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-lg font-bold text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.55 }}
          >
            <Sparkles size={18} style={{ color: colors[0] }} />
            +{xpEarned} XP
          </motion.div>

          <button
            onClick={onClose}
            className="mt-8 rounded-xl bg-white px-8 py-3 font-medium text-slate-900 transition hover:scale-105"
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
