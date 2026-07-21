import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Clock } from "lucide-react";
import { enrichQuiz } from "../../utils/quizHelpers";

import { getLanguageIcon } from "../../utils/languageIcons";

const RecommendedCard = ({ quiz: rawQuiz }) => {
  const quiz = enrichQuiz(rawQuiz);
  const progressWidth = `${quiz.progress}%`;
  const { icon: LanguageIcon } = getLanguageIcon(quiz.subject);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="flex-shrink-0 w-[260px] group"
    >
      <Link
        to={`/quiz/${quiz.id}`}
        className="block rounded-2xl overflow-hidden surface border border-app shadow-sm hover:shadow-lg hover:border-violet-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
      >
        {/* Thumbnail */}
        <div className="relative h-[140px] overflow-hidden surface-subtle flex items-center justify-center">
          {quiz.isDynamicThumbnail ? (
            <div className="w-full h-full flex flex-col items-center justify-center opacity-90 group-hover:scale-105 transition-transform duration-500 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              <LanguageIcon size={48} className="mb-2 drop-shadow-sm text-app" />
              <span className="text-slate-700 dark:text-slate-200 font-black text-lg tracking-widest uppercase">{quiz.subject || "Code"}</span>
            </div>
          ) : (
            <img
              src={quiz.thumbnail}
              alt={quiz.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )}
          {/* Recommended Badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
              Recommended
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h4 className="font-semibold text-sm text-app truncate mb-1">
            {quiz.title}
          </h4>
          <p className="text-xs text-app-muted mb-3">
            {quiz.subject} • {quiz.classLevel}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-[11px] text-app-muted font-medium mb-3">
            <span className="inline-flex items-center gap-1">
              <FileText size={12} />
              {quiz.questions} Questions
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {quiz.duration} min
            </span>
          </div>

          {/* Progress */}
          <div>
            <div className="h-1.5 w-full surface-elev rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full transition-all duration-500"
                style={{ width: progressWidth }}
              />
            </div>
            <p className="text-[10px] font-medium text-app-muted mt-1.5">
              {quiz.progress}% Completed
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default RecommendedCard;
