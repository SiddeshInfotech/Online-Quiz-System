import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

/**
 * Accessible light/dark switch.
 * Light: shows a sun and switches to dark on click.
 * Dark:  shows a moon with a gold-to-blue sheen.
 */
function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
            className={`
        relative inline-flex h-10 w-10 items-center justify-center rounded-xl
        border transition-colors duration-300
        ${isDark
                    ? "border-[#33333F] bg-[#16161F] text-[#F5C451] hover:border-[#F5C451]/50"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-600"}
        ${className}
      `}
        >
            <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                    <motion.span
                        key="moon"
                        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Moon size={18} />
                    </motion.span>
                ) : (
                    <motion.span
                        key="sun"
                        initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Sun size={18} />
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );
}

export default ThemeToggle;
