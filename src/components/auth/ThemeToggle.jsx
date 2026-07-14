import { Moon } from "lucide-react";

const ThemeToggle = () => {
  return (
    <button
      type="button"
      className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-100"
      aria-label="Toggle theme"
    >
      <Moon size={18} />
    </button>
  );
};

export default ThemeToggle;