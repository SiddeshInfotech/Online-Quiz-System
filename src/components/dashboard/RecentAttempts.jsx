import { Link } from "react-router-dom";
import { Calculator, Landmark, ClipboardList } from "lucide-react";
import Card from "../ui/Card/Card";
import Button from "../ui/Button";
import { getLanguageIcon } from "../../utils/languageIcons";

const getIconConfig = (attempt) => {
  const { icon: LangIcon } = getLanguageIcon(attempt.subject || attempt.category);
  return { icon: LangIcon, bg: "bg-[var(--bg-elevated)]" };
};

const getScoreColor = (score) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

const RecentAttempts = ({ attempts, isLoading }) => {
  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-app-2 text-sm">Recent Quiz Attempts</h3>
        <Link to="/attempts" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4 flex-1 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-transparent animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded"></div>
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-5 w-10 bg-slate-200 rounded ml-auto"></div>
                <div className="h-3 w-16 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : attempts && attempts.length > 0 ? (
        <div className="flex flex-col gap-4 flex-1 mt-2">
          {attempts.map((attempt) => {
            const { icon: Icon, bg } = getIconConfig(attempt);

            return (
              <div key={attempt.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-elevated)] transition-all duration-300 border border-transparent hover:border-app group cursor-pointer hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-app group-hover:text-violet-700 transition-colors">{attempt.title}</h4>
                    <p className="text-xs text-app-muted mt-0.5">{attempt.subject} • {attempt.classLevel}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`block font-bold text-sm font-space-grotesk ${getScoreColor(attempt.score)}`}>
                    {attempt.score}%
                  </span>
                  <span className="text-[10px] text-app-muted font-medium">{attempt.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8 group">
          <div className="w-16 h-16 rounded-2xl surface-subtle border border-dashed border-app flex items-center justify-center text-app-muted group-hover:bg-violet-50 group-hover:text-violet-500 group-hover:border-violet-200 transition-colors duration-300">
            <ClipboardList size={28} className="group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-app-2 group-hover:text-violet-700 transition-colors">No quiz attempts yet.</p>
            <p className="text-xs text-app-muted mt-1 max-w-[200px] leading-relaxed">Take your first quiz to see your detailed results here!</p>
          </div>
          <Link to="/library" className="mt-2">
            <Button variant="outline" size="sm" className="text-xs font-semibold surface hover:border-violet-300 hover:text-violet-700 transition-colors">
              Explore Quizzes
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};

export default RecentAttempts;

