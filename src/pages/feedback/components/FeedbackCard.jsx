import { CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import StarRating from "./StarRating";

const timeAgo = (dateString) => {
  if (!dateString) return "";
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

export const formatReplyDate = (dateString) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export const normalizeFeedback = (raw) => {
  if (!raw) return raw;

  const reply_message = raw.reply_message || raw.admin_reply || raw.reply || null;
  const reply_date = raw.reply_date || raw.replied_at || raw.updated_at || null;
  const replied_by_username = raw.replied_by_username || raw.replied_by || raw.admin_name || "admin";

  return {
    ...raw,
    id: raw.id,
    rating: raw.rating,
    message: raw.message,
    status: raw.status || (reply_message ? "Replied" : "Pending"),

    reply_message: reply_message ? String(reply_message).trim() : null,
    reply_date: reply_date,
    replied_by_username: replied_by_username,

    created_at: raw.created_at,
    updated_at: raw.updated_at,
    user: raw.user,
    user_name: raw.user_name || raw.student_name || raw.username,
    profile_picture: raw.profile_picture,
  };
};

const FeedbackCard = ({ feedback: rawFeedback }) => {
  const feedback = normalizeFeedback(rawFeedback);
  const { user, rating, message, created_at, updated_at, reply_message, reply_date, replied_by_username } = feedback;

  const userName =
    user?.full_name || user?.username || feedback.user_name || feedback.student_name || "Anonymous Learner";

  const profilePic =
    user?.profile_picture ||
    feedback.profile_picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6D5EF9&color=fff`;

  const isEdited = updated_at && new Date(updated_at).getTime() - new Date(created_at).getTime() > 1000;
  const displayTime = isEdited ? `Updated ${timeAgo(updated_at)}` : timeAgo(created_at);

  const hasReply = !!feedback.reply_message && feedback.reply_message.trim().length > 0;

  return (
    <div className="surface p-5 rounded-2xl shadow-sm border border-app mb-4 hover:shadow-md transition-shadow">
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
            <h4 className="font-semibold text-app text-sm">{userName}</h4>
            <div className="text-xs text-app-muted">{displayTime}</div>
          </div>
        </div>
        <StarRating rating={rating} readOnly size={16} />
      </div>

      <p className="text-app-2 text-sm leading-relaxed mt-2 whitespace-pre-wrap">{message}</p>

      {/* Admin Reply Card Section */}
      {hasReply ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              ✔ Admin Reply
            </span>
            {reply_date && (
              <span className="text-[11px] text-emerald-400/80 font-medium">{formatReplyDate(reply_date)}</span>
            )}
          </div>
          <p className="text-xs text-slate-200 dark:text-slate-100 leading-relaxed font-normal whitespace-pre-wrap">
            "{reply_message}"
          </p>
          <div className="text-[10px] text-emerald-400/90 font-semibold pt-1">— {replied_by_username || "admin"}</div>
        </motion.div>
      ) : (
        <div className="mt-3 text-[11px] text-app-muted flex items-center gap-1.5 font-medium">
          <Clock size={12} className="text-amber-500/70 shrink-0" /> No reply from admin yet.
        </div>
      )}
    </div>
  );
};

export default FeedbackCard;
