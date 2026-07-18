import Badge from "../Badge";

function SectionHeading({
  badge,
  title,
  description,
  align = "center",
}) {
  return (
    <div
      className={`mb-14 ${align === "center" ? "text-center" : "text-left"
        }`}
    >
      {badge && (
        <div className="mb-4">
          <Badge>{badge}</Badge>
        </div>
      )}

      <h2 className="text-4xl font-bold text-app">
        {title}
      </h2>

      {description && (
        <p className="mt-4 text-lg text-app-2">
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;