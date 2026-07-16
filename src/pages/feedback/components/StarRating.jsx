import { Star } from "lucide-react";
import { useState } from "react";

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  readOnly = false,
  size = 24 
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (index) => {
    if (!readOnly) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  const handleClick = (index) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(index);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = index <= (hoverRating || rating);
        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            className={`focus:outline-none transition-transform ${!readOnly ? "hover:scale-110" : "cursor-default"}`}
          >
            <Star
              size={size}
              className={`transition-colors ${
                isFilled 
                  ? "fill-amber-400 text-amber-400" 
                  : "fill-slate-100 text-slate-200"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
