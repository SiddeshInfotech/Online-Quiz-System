const variants = {
  primary:
    "bg-violet-100 text-violet-700 border border-violet-200",

  success:
    "bg-green-100 text-green-700 border border-green-200",

  warning:
    "bg-yellow-100 text-yellow-700 border border-yellow-200",

  danger:
    "bg-red-100 text-red-700 border border-red-200",

  gray:
    "bg-slate-100 text-slate-600 border border-slate-200",
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