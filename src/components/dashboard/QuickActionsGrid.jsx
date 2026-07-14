import { Link } from "react-router-dom";
import { ClipboardList, LogIn, Target, FileSpreadsheet, BookOpen, Compass } from "lucide-react";
import Card from "../ui/Card/Card";
import Button from "../ui/Button/Button";

const QuickActionsGrid = ({ lastQuiz, availableQuizzesCount, isLoading }) => {
  const quickActions = [
    { name: "Explore Quizzes", icon: Compass, color: "text-violet-600", bg: "bg-violet-50", path: "/library" },
    { name: "Join Quiz", icon: LogIn, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Practice Mode", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Mock Test", icon: FileSpreadsheet, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Continue Last Quiz / No Quiz In Progress */}
      <Card hover className="p-5 flex flex-col justify-between border-slate-200">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">Continue Last Quiz</h3>

        {isLoading ? (
          <div className="flex flex-col flex-1 gap-4 animate-pulse pt-2">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-xl bg-slate-200 flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-1.5 w-full bg-slate-200 rounded-full"></div>
                <div className="h-2 bg-slate-200 rounded w-1/3 mt-1"></div>
              </div>
              <div className="w-20 h-8 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        ) : lastQuiz ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              {/* Placeholder for Planet 3D Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-inner relative overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105">
                 <div className="absolute w-16 h-4 border-2 border-white/20 rounded-[50%] -rotate-12"></div>
                 <div className="w-6 h-6 rounded-full bg-indigo-300 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)] z-10"></div>
                 <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full"></div>
                 <div className="absolute bottom-3 right-3 w-1.5 h-1.5 bg-indigo-200 rounded-full"></div>
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-semibold text-slate-900 truncate group-hover:text-violet-700 transition-colors">{lastQuiz.title}</h4>
                <p className="text-xs text-slate-500 truncate">{lastQuiz.subject} • {lastQuiz.classLevel}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-600 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${lastQuiz.progress}%` }} 
                  />
                </div>
                <p className="text-[10px] font-medium text-slate-500 mt-1">{lastQuiz.progress}% Completed</p>
              </div>
              <Button variant="primary" size="sm" className="px-4 text-xs h-8 hover:scale-105 transition-transform">Continue</Button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-500 transition-colors">
              <BookOpen size={22} />
            </div>
            <p className="text-xs text-slate-400 text-center font-medium leading-relaxed group-hover:text-slate-500 transition-colors">
              No quiz in progress.<br />Start one to continue here!
            </p>
            <Link to="/library">
              <Button variant="outline" size="sm" className="text-xs font-semibold bg-white mt-1 hover:border-violet-300 hover:text-violet-700 transition-colors">
                Browse Quizzes
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Available Quizzes */}
      <Card hover className="p-5 flex flex-col items-center justify-center text-center">
        <h3 className="font-semibold text-slate-700 text-sm w-full text-left absolute top-5 left-5">Available Quizzes</h3>
        {isLoading ? (
          <div className="mt-6 flex flex-col items-center gap-2 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 mb-1"></div>
            <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
            <div className="h-3 w-24 bg-slate-200 rounded mb-4"></div>
            <div className="h-8 w-full bg-slate-200 rounded-lg"></div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <ClipboardList size={24} />
            </div>
            <h2 className="text-3xl font-bold font-space-grotesk text-slate-900">{availableQuizzesCount}</h2>
            <p className="text-xs text-slate-500 font-medium mb-4">Quizzes Available</p>
            <Link to="/library" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold bg-white hover:border-violet-300 hover:text-violet-700 transition-colors">Browse Library</Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card hover className="p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 h-[calc(100%-2rem)]">
          {quickActions.map((action, idx) => {
            const Content = (
              <>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon size={12} />
                </div>
                <span className="truncate">{action.name}</span>
              </>
            );
            
            const className = "flex items-center justify-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-violet-200 hover:shadow-sm transition-all text-xs font-medium text-slate-700 group";

            return action.path ? (
              <Link key={idx} to={action.path} className={className}>
                {Content}
              </Link>
            ) : (
              <button key={idx} className={className}>
                {Content}
              </button>
            );
          })}
        </div>
      </Card>

    </div>
  );
};

export default QuickActionsGrid;

