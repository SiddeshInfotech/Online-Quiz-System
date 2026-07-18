import { Link } from "react-router-dom";

const Logo = ({ className = "", isDarkBg = false }) => {
  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xl text-white transition-all duration-300 group-hover:scale-105"
        style={{ background: "var(--grad-primary)" }}
      >
        Q
      </div>
      <span
        className={`text-xl font-bold font-space-grotesk transition-colors duration-300 ${isDarkBg ? "text-white" : "text-app group-hover:text-[var(--accent)]"
          }`}
      >
        QuizGen AI
      </span>
    </Link>
  );
};

export default Logo;
