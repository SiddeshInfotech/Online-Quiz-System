function Card({
  children,
  className = "",
  hover = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-3xl
        border
        border-app
        surface-elev
        shadow-sm
        transition-all
        duration-300
        ${hover
          ? "hover:-translate-y-1 hover:shadow-xl hover:border-[var(--accent)]"
          : ""
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;