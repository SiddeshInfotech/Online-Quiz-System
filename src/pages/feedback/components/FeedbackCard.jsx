import StarRating from "./StarRating";

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return "just now";
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " year" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " month" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " day" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
  
  return Math.floor(seconds) + " seconds ago";
};

const FeedbackCard = ({ feedback }) => {
  const { user, rating, message, created_at, updated_at } = feedback;
  const userName = user?.full_name || user?.username || "Anonymous Learner";
  
  // Use UI Avatars as fallback if no profile picture
  const profilePic = user?.profile_picture || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6D5EF9&color=fff`;

  const isEdited = updated_at && new Date(updated_at).getTime() - new Date(created_at).getTime() > 1000;
  const displayTime = isEdited ? `Updated ${timeAgo(updated_at)}` : timeAgo(created_at);

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={profilePic}
            alt={userName}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6D5EF9&color=fff`;
            }}
            className="w-10 h-10 rounded-full object-cover shadow-sm"
          />
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">{userName}</h4>
            <div className="text-xs text-slate-400">
              {displayTime}
            </div>
          </div>
        </div>
        <StarRating rating={rating} readOnly size={16} />
      </div>
      <p className="text-slate-600 text-sm leading-relaxed mt-2 whitespace-pre-wrap">
        {message}
      </p>
    </div>
  );
};

export default FeedbackCard;
