import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Clock, Play, UserCheck } from "lucide-react";
import Button from "../ui/Button/Button";
import { getLanguageIcon } from "../../utils/languageIcons";

import { enrichQuiz } from "../../utils/quizHelpers";

const difficultyColors = {
  Easy: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

const progressColor = (progress) => {
  if (progress >= 100) return "text-emerald-600";
  if (progress >= 50) return "text-violet-600";
  return "text-amber-500";
};

const QuizCard = ({ quiz: rawQuiz, viewMode = "grid" }) => {
  const quiz = enrichQuiz(rawQuiz);
  const { icon: LanguageIcon, color: iconColor } = getLanguageIcon(quiz.subject);

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="group"
      >
        <Link
          to={`/quiz/${quiz.id}`}
          className="flex items-center gap-5 p-4 rounded-2xl surface border border-app hover:shadow-lg hover:border-violet-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
        >
          {/* Thumbnail */}
          <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 relative bg-slate-50 flex items-center justify-center">
            {quiz.isDynamicThumbnail ? (
              <div className="w-full h-full flex items-center justify-center opacity-90 group-hover:scale-105 transition-transform duration-500 bg-gradient-to-br from-slate-100 to-slate-200">
                <LanguageIcon size={40} className="drop-shadow-sm" />
              </div>
            ) : (
              <img
                src={quiz.thumbnail}
                alt={quiz.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base text-app truncate group-hover:text-violet-700 transition-colors flex items-center gap-2">
              <LanguageIcon size={18} className="flex-shrink-0" />
              {quiz.title}
            </h4>
            <p className="text-xs text-app-muted mt-1">
              {quiz.classLevel}
            </p>
          </div>

          {/* Meta */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <FileText size={14} />
              {quiz.questions}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              {quiz.duration} min
            </span>
          </div>

          {/* Difficulty */}
          <span
            className={`hidden md:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full ${
              difficultyColors[quiz.difficulty]
            }`}
          >
            {quiz.difficulty}
          </span>

          {/* Progress */}
          <span
            className={`text-xs font-bold w-12 text-right ${progressColor(quiz.progress)}`}
          >
            {quiz.progress}%
          </span>
          
          <div className="hidden lg:block">
             <Button variant="primary" size="sm" className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <Play size={14} className="mr-1.5" /> Start
             </Button>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -6 }}
      className="group h-full"
    >
      <div className="rounded-2xl overflow-hidden surface border border-app shadow-sm hover:shadow-xl hover:border-violet-300 transition-all duration-300 h-full flex flex-col focus-within:ring-2 focus-within:ring-violet-400">
        {/* Thumbnail */}
        <div className="relative h-[140px] overflow-hidden bg-slate-50 flex items-center justify-center">
          <Link to={`/quiz/${quiz.id}`} className="block w-full h-full focus:outline-none">
            {quiz.isDynamicThumbnail ? (
              <div className="w-full h-full flex flex-col items-center justify-center opacity-90 group-hover:scale-105 transition-transform duration-700 bg-gradient-to-br from-slate-100 to-slate-200">
                 <LanguageIcon size={72} className="mb-3 drop-shadow-sm" />
                 <span className="text-slate-700 font-black text-xl tracking-widest uppercase">{quiz.subject || "Code"}</span>
              </div>
            ) : (
              <img
                src={quiz.thumbnail}
                alt={quiz.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Link>

          {/* Subject Badge */}
          <div className="absolute bottom-3 left-3 z-10">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${quiz.subjectColor}`}
            >
              <LanguageIcon size={12} className="bg-white/80 rounded-sm p-0.5" />
              {quiz.subject}
            </span>
          </div>

          {/* Creator Badge */}
          <div className="absolute top-3 right-3 z-10">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md ${
                rawQuiz?.is_admin_quiz || quiz.is_admin_quiz || quiz.isAdminQuiz
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-200 border border-slate-700"
              }`}
            >
              <UserCheck size={11} />
              {rawQuiz?.created_by_label || quiz.created_by_label || (rawQuiz?.is_admin_quiz || quiz.is_admin_quiz ? "QuizGen AI" : (rawQuiz?.created_by_me || quiz.createdByMe ? "Created by You" : "QuizGen AI"))}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <Link
            to={`/quiz/${quiz.id}`}
            className="block focus:outline-none mb-3"
          >
            <h4 className="font-bold text-base text-app line-clamp-1 group-hover:text-violet-700 transition-colors">
              {quiz.title}
            </h4>
            <p className="text-xs text-app-muted mt-1">{quiz.classLevel}</p>
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mb-4">
            <span className="inline-flex items-center gap-1.5">
              <FileText size={14} />
              {quiz.questions} Qs
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              {quiz.duration} min
            </span>
          </div>

          {/* Bottom: Difficulty + Progress */}
          <div className="flex items-center justify-between mb-4">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                difficultyColors[quiz.difficulty]
              }`}
            >
              {quiz.difficulty}
            </span>
            <span
              className={`text-xs font-bold ${progressColor(quiz.progress)}`}
            >
              {quiz.progress}% Done
            </span>
          </div>

          {/* Start Button */}
          <div className="mt-auto pt-2 border-t border-app">
            <Link to={`/quiz/${quiz.id}`} tabIndex={-1} className="block w-full focus:outline-none">
              <Button
                variant={quiz.progress > 0 ? "outline" : "primary"}
                className={`w-full transition-all duration-300 ${quiz.progress > 0 ? "group-hover:bg-violet-50 dark:group-hover:bg-violet-500/20 group-hover:text-violet-700 dark:group-hover:text-violet-300 group-hover:border-violet-200 dark:group-hover:border-violet-500/40" : "group-hover:bg-violet-700"}`}
              >
                <Play size={16} className="mr-2" />
                {quiz.progress > 0 ? "Continue Quiz" : "Start Quiz"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuizCard;
