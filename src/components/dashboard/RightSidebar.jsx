import { Link } from "react-router-dom";
import { Trophy, Calendar, Star, FileText, Target, Pin, ArrowRight } from "lucide-react";
import Card from "../ui/Card/Card";

const getNotificationIcon = (type) => {
  switch (String(type).toLowerCase()) {
    case "trophy":
      return { icon: Trophy, bg: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20" };
    case "calendar":
      return { icon: Calendar, bg: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20" };
    case "star":
      return { icon: Star, bg: "bg-orange-500/15 text-orange-500 dark:text-orange-400 border border-orange-500/20" };
    case "document":
      return { icon: FileText, bg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20" };
    case "target":
      return { icon: Target, bg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20" };
    default:
      return { icon: Star, bg: "surface-elev text-app-muted border border-app" };
  }
};

const RightSidebar = ({ notifications = [] }) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Notifications Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-app font-space-grotesk text-sm">Notifications</h3>
          <span className="text-[11px] font-semibold text-app-muted bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </div>
        
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => {
            const isPinned = notif.id === "profile_completion_reminder" || notif.time === "Pinned";
            const { icon: Icon, bg } = getNotificationIcon(notif.iconType);

            if (isPinned) {
              return (
                <div
                  key={notif.id}
                  className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-indigo-500/15 border border-violet-400/50 dark:border-violet-500/50 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white shadow-sm">
                      <Pin size={10} className="rotate-45" /> Pinned Reminder
                    </span>
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                      Action Required
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mt-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-app font-space-grotesk mb-1">
                        {notif.title || "Profile Completion"}
                      </h4>
                      <p className="text-xs text-app-2 leading-relaxed whitespace-pre-line font-medium">
                        {notif.text}
                      </p>

                      <Link
                        to={notif.actionUrl || "/profile"}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mt-3 group"
                      >
                        <span>Complete Profile</span>
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={notif.id}
                className="surface-elev rounded-2xl p-3.5 border border-app hover:border-violet-300 dark:hover:border-violet-700 transition-colors shadow-sm flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  {notif.title && (
                    <h4 className="text-xs font-semibold text-app mb-0.5">{notif.title}</h4>
                  )}
                  <p className="text-xs text-app-2 leading-relaxed font-medium whitespace-pre-line">
                    {notif.text}
                  </p>
                  <p className="text-[10px] text-app-muted mt-1.5 font-medium">{notif.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
