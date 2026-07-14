import { Link } from "react-router-dom";

const Logo = ({ className = "", isDarkBg = false }) => {
  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-violet-600/25">
        Q
      </div>
      <span className={`text-xl font-bold font-space-grotesk transition-colors duration-300 ${isDarkBg ? "text-white group-hover:text-violet-200" : "text-slate-900 group-hover:text-violet-700"}`}>
        QuizGen AI
      </span>
    </Link>
  );
};

export default Logo;
