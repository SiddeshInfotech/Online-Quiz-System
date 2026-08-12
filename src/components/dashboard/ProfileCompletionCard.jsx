import { Link } from "react-router-dom";
import { UserCheck, ArrowRight } from "lucide-react";
import Card from "../ui/Card/Card";
import Button from "../ui/Button/Button";

const formatFieldName = (field) => {
  if (!field) return "";
  return String(field)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const ProfileCompletionCard = ({ user }) => {
  const completion = user?.profile_completion ?? 100;
  const missingFields = user?.missing_fields ?? [];

  // Automatically hide when profile completion reaches 100%
  if (completion >= 100) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-200 dark:border-violet-800/40 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3.5 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/30 shrink-0">
            <UserCheck size={24} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-space-grotesk font-bold text-lg text-app">
                Profile Completion
              </h3>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-violet-600 text-white shadow-sm">
                {completion}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>

            {/* Missing Fields Bullet List */}
            {missingFields.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-semibold text-app-muted mb-1">Missing:</p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-app-2">
                  {missingFields.map((field) => (
                    <li key={field} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      {formatFieldName(field)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Complete Profile Button */}
        <Link to="/profile?edit=true" className="shrink-0 w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto gap-2 text-xs cursor-pointer">
            <span>Complete Profile</span>
            <ArrowRight size={15} />
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default ProfileCompletionCard;
