import { Link } from "react-router-dom";
import { Trophy, Calendar, Star, FileText, Target, Pin, ArrowRight, Bell } from "lucide-react";
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

export const TopNotificationsPanel = ({ notifications = [] }) => {
  return (
    <Card className="p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3 border-b border-app/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 text-violet-400 shrink-0">
            <Bell size={16} />
          </div>
          <h3 className="font-bold text-app font-space-grotesk text-sm">Notifications</h3>
        </div>
        <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
          {notifications.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-2.5 custom-scrollbar">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const isPinned = notif.id === "profile_completion_reminder" || notif.time === "Pinned";
            const { icon: Icon, bg } = getNotificationIcon(notif.iconType);

            if (isPinned) {
              return (
                <div
                  key={notif.id}
                  className="relative overflow-hidden rounded-xl p-2.5 bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-indigo-500/15 border border-violet-400/50 dark:border-violet-500/50 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-600 text-white">
                      <Pin size={9} className="rotate-45" /> Pinned
                    </span>
                    <span className="text-[10px] font-bold text-violet-400">Action Needed</span>
                  </div>

                  <div className="flex items-start gap-2 mt-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-app font-space-grotesk truncate">
                        {notif.title || "Profile Completion"}
                      </h4>
                      <p className="text-[11px] text-app-2 leading-snug line-clamp-2 mt-0.5 font-medium">
                        {notif.text}
                      </p>
                      <Link
                        to={notif.actionUrl || "/profile"}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300 mt-1.5 group"
                      >
                        <span>Complete Profile</span>
                        <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={notif.id}
                className="surface-elev rounded-xl p-2.5 border border-app hover:border-violet-400/50 transition-colors shadow-sm flex items-start gap-2.5"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  {notif.title && (
                    <h4 className="text-xs font-semibold text-app truncate mb-0.5">{notif.title}</h4>
                  )}
                  <p className="text-[11px] text-app-2 leading-snug font-medium line-clamp-2">
                    {notif.text}
                  </p>
                  <p className="text-[10px] text-app-muted mt-1 font-medium">{notif.time}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-app-muted text-xs font-medium">
            No new notifications
          </div>
        )}
      </div>
    </Card>
  );
};

const RightSidebar = ({ notifications = [] }) => {
  return <TopNotificationsPanel notifications={notifications} />;
};

export default RightSidebar;
