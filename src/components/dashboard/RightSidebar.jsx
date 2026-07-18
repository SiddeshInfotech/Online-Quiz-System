import { Trophy, Calendar, Star, FileText, Target } from "lucide-react";
import Card from "../ui/Card/Card";

const getNotificationIcon = (type) => {
  switch (String(type).toLowerCase()) {
    case "trophy":
      return { icon: Trophy, bg: "bg-amber-100", color: "text-amber-500" };
    case "calendar":
      return { icon: Calendar, bg: "bg-violet-100", color: "text-violet-600" };
    case "star":
      return { icon: Star, bg: "bg-orange-100", color: "text-orange-500" };
    case "document":
      return { icon: FileText, bg: "bg-cyan-100", color: "text-cyan-500" };
    case "target":
      return { icon: Target, bg: "bg-purple-100", color: "text-purple-600" };
    default:
      return { icon: Star, bg: "bg-slate-100", color: "text-slate-600" };
  }
};

const RightSidebar = ({ notifications }) => {

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Notifications */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-700 text-sm">Notifications</h3>
          <button className="text-xs font-semibold text-violet-600 hover:text-violet-700">
            View All
          </button>
        </div>
        
        <div className="flex flex-col gap-5">
          {notifications.map((notif) => {
            const { icon: Icon, bg, color } = getNotificationIcon(notif.iconType);
            return (
              <div key={notif.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                    {notif.text}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
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
