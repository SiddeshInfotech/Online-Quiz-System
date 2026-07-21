const variants = {
  primary:
    "bg-[var(--accent-soft)] text-[var(--accent)] border border-[color:var(--accent)]/30",

  success:
    "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",

  warning:
    "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",

  danger:
    "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",

  gray:
    "surface-subtle text-app-2 border border-app",
};

function Badge({
  children,
  variant = "primary",
  className = "",
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-xs
        font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export default Badge;