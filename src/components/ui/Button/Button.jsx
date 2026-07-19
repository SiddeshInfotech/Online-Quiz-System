const variants = {
  // Primary uses the theme accent (violet in light, gold in dark) via CSS vars.
  primary:
    "text-[var(--accent-contrast)] shadow-lg hover:-translate-y-0.5 [background:var(--grad-primary)] hover:shadow-xl hover:brightness-110",

  secondary:
    "surface text-app border border-app hover:border-[var(--accent)] hover:shadow-lg",

  outline:
    "border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)] hover:shadow-md",

  ghost:
    "bg-transparent text-app-2 hover:surface-subtle",

  danger:
    "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20",

  // On-gradient CTA button (used on colored panels)
  cta:
    "bg-white text-violet-600 shadow-lg hover:bg-slate-100 hover:shadow-xl dark:bg-[#222838] dark:text-white dark:hover:bg-[#32384A]",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  className = "",
  onClick,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-xl font-medium
        transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        focus:outline-none focus-visible:outline-2
        disabled:opacity-50 disabled:pointer-events-none
        disabled:hover:scale-100 disabled:hover:translate-y-0
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default Button;
