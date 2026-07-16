import StarRating from "./StarRating";

const RatingDistribution = ({ summary }) => {
  if (!summary) return null;

  const { average_rating, total_reviews, distribution } = summary;

  // Ensure distribution exists and handles missing keys
  const getCount = (stars) => distribution?.[stars] || 0;
  const getPercentage = (stars) => {
    if (total_reviews === 0) return 0;
    return Math.round((getCount(stars) / total_reviews) * 100);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      {/* Average Rating Block */}
      <div className="flex flex-col items-center justify-center min-w-[150px]">
        <div className="text-5xl font-bold text-slate-900 mb-2">
          {average_rating?.toFixed(1) || "0.0"}
        </div>
        <StarRating rating={Math.round(average_rating || 0)} readOnly size={20} />
        <div className="text-sm text-slate-500 mt-2">
          {total_reviews} {total_reviews === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="flex-1 w-full flex flex-col gap-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const percentage = getPercentage(stars);
          return (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12 text-sm font-medium text-slate-600">
                {stars} <span className="text-amber-400">★</span>
              </div>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-10 text-right text-xs text-slate-500">
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingDistribution;
