import { Link } from "react-router-dom";
import { ClipboardList, BookOpen } from "lucide-react";
import Card from "../ui/Card/Card";
import Button from "../ui/Button/Button";
import { getLanguageIcon } from "../../utils/languageIcons";

const QuizActivityCards = ({ lastQuiz, availableQuizzesCount, isLoading }) => {
  const { icon: LangIcon, color: iconColor } = getLanguageIcon(lastQuiz?.subject);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Continue Last Quiz / No Quiz In Progress */}
      <Card hover className="p-5 flex flex-col justify-between border-app">
        <h3 className="font-semibold text-app-2 text-sm mb-4">Continue Last Quiz</h3>

        {isLoading ? (
          <div className="flex flex-col flex-1 gap-4 animate-pulse pt-2">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-xl surface-subtle flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 surface-subtle rounded w-3/4"></div>
                <div className="h-3 surface-subtle rounded w-1/2"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-1.5 w-full surface-subtle rounded-full"></div>
                <div className="h-2 surface-subtle rounded w-1/3 mt-1"></div>
              </div>
              <div className="w-20 h-8 surface-subtle rounded-lg"></div>
            </div>
          </div>
        ) : lastQuiz ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105 bg-[var(--bg-elevated)]"
              >
                 <LangIcon size={30} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-semibold text-app truncate group-hover:text-violet-700 transition-colors">{lastQuiz.title}</h4>
                <p className="text-xs text-app-muted truncate">
                  {lastQuiz.subject}{lastQuiz.classLevel ? ` • ${lastQuiz.classLevel}` : ""}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-1.5 w-full surface-elev rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-600 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${lastQuiz.progress}%` }} 
                  />
                </div>
                <p className="text-[10px] font-medium text-app-muted mt-1 flex items-center justify-between">
                  <span>{lastQuiz.progress}% Completed</span>
                  {lastQuiz.total_questions > 0 && (
                    <span>({lastQuiz.answered_questions}/{lastQuiz.total_questions})</span>
                  )}
                </p>
              </div>
              {(lastQuiz.attempt_id || lastQuiz.quiz_id) ? (
                <Link 
                  to={lastQuiz.attempt_id ? `/attempts/${lastQuiz.attempt_id}` : `/quiz/${lastQuiz.quiz_id}`}
                  state={{ 
                    startIndex: lastQuiz.current_question_index, 
                    remainingTime: lastQuiz.remaining_time_seconds 
                  }}
                >
                  <Button variant="primary" size="sm" className="px-4 text-xs h-8 hover:scale-105 transition-transform">Continue</Button>
                </Link>
              ) : (
                <Button variant="primary" size="sm" className="px-4 text-xs h-8 opacity-50 cursor-not-allowed">Continue</Button>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-4">
            <div className="w-12 h-12 rounded-xl surface-subtle flex items-center justify-center text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-500 transition-colors">
              <BookOpen size={22} />
            </div>
            <p className="text-xs text-app-muted text-center font-medium leading-relaxed group-hover:text-app-2 transition-colors">
              No quiz in progress.<br />Start one to continue here!
            </p>
            <Link to="/library">
              <Button variant="outline" size="sm" className="text-xs font-semibold surface mt-1 hover:border-violet-300 hover:text-violet-700 transition-colors">
                Browse Quizzes
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Available Quizzes */}
      <Card hover className="p-5 flex flex-col items-center justify-center text-center">
        <h3 className="font-semibold text-app-2 text-sm w-full text-left absolute top-5 left-5">Available Quizzes</h3>
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
            <h2 className="text-3xl font-bold font-space-grotesk text-app">{availableQuizzesCount}</h2>
            <p className="text-xs text-app-muted font-medium mb-4">Quizzes Available</p>
            <Link to="/library" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold bg-white hover:border-violet-300 hover:text-violet-700 transition-colors">Browse Library</Button>
            </Link>
          </div>
        )}
      </Card>

    </div>
  );
};

export default QuizActivityCards;
