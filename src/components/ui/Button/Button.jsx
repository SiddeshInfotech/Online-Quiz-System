const variants = {
  primary:
    "bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-600/30",

  secondary:
    "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-violet-300 hover:shadow-lg",

  outline:
    "border border-violet-600 text-violet-600 hover:bg-violet-50 hover:shadow-md",

  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100",

  danger:
    "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20",
  cta:
  "bg-white text-violet-600 shadow-lg hover:bg-slate-100 hover:shadow-xl",
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
        inline-flex
        items-center
        justify-center
        rounded-xl
        font-medium
        transition-all
        duration-300
        ease-in-out
        hover:-translate-y-0.5
        hover:scale-105
        active:scale-95
        focus:outline-none
        focus:ring-2
        focus:ring-violet-400
        focus:ring-offset-2
        disabled:opacity-50
        disabled:pointer-events-none
        disabled:hover:scale-100
        disabled:hover:translate-y-0
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