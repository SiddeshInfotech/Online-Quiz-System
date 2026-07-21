import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  Brain,
  Play,
  Sparkles,
  AlertTriangle,
  X,
  Info,
  BookOpen,
  Target,
} from "lucide-react";
import Button from "../../components/ui/Button";
import libraryService from "../../services/libraryService";
import attemptsService from "../../services/attemptsService";
import { getLanguageIcon } from "../../utils/languageIcons";
import Card from "../../components/ui/Card/Card";

/* ─────────────────────────────────────────────
   Skeleton helpers
───────────────────────────────────────────── */
const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse surface-elev rounded-lg ${className}`}
    aria-hidden="true"
  />
);

const SkeletonPage = () => (
  <div className="w-full max-w-4xl mx-auto pb-12 pt-8">
    <Skeleton className="h-5 w-32 mb-8" />
    <div className="rounded-3xl border border-app surface shadow-sm p-8 md:p-10">
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <Skeleton className="h-10 w-3/4 mb-3 rounded-xl" />
      <Skeleton className="h-5 w-full mb-2 rounded" />
      <Skeleton className="h-5 w-2/3 mb-8 rounded" />
      <hr className="border-app mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-2xl mb-8" />
      <div className="flex gap-4 justify-end pt-8 border-t border-app">
        <Skeleton className="h-12 w-40 rounded-xl" />
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Start Quiz Confirmation Modal
───────────────────────────────────────────── */
const StartQuizModal = ({ quiz, onConfirm, onCancel }) => {
  const questionCount =
    quiz?.num_questions ??
    quiz?.number_of_questions ??
    (Array.isArray(quiz?.questions) ? quiz.questions.length : null);
  const timeLimit = quiz?.time_limit ?? quiz?.duration;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        />

        {/* Modal */}
        <motion.div
          className="relative surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
          <div className="p-7">
            <button
              onClick={onCancel}
              className="absolute top-5 right-5 text-app-muted hover:text-app-2 transition-colors rounded-lg p-1 hover:bg-[var(--bg-elevated)]"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-100 mb-5 mx-auto">
              <Play size={26} className="text-violet-600 translate-x-0.5" />
            </div>

            <h2 className="text-xl font-bold font-space-grotesk text-app text-center mb-1">
              Ready to Start?
            </h2>
            <p className="text-app-muted text-sm text-center mb-6 leading-relaxed">
              You are about to begin{" "}
              <span className="font-semibold text-app-2">
                {quiz?.title ?? quiz?.quiz_title ?? "this quiz"}
              </span>
              . Once started, the timer cannot be paused.
            </p>

            {(questionCount != null || timeLimit != null) && (
              <div className="flex gap-3 mb-6">
                {questionCount != null && (
                  <div className="flex-1 surface-subtle border border-app rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-app">{questionCount}</div>
                    <div className="text-xs text-app-muted font-medium">Questions</div>
                  </div>
                )}
                {timeLimit != null && (
                  <div className="flex-1 surface-subtle border border-app rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-app">{timeLimit}m</div>
                    <div className="text-xs text-app-muted font-medium">Time Limit</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-amber-700 text-xs leading-relaxed">
                Make sure you have a stable internet connection and are in a distraction-free environment before starting.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>
                Go Back
              </Button>
              <Button variant="primary" size="md" className="flex-1" onClick={onConfirm}>
                <Play size={16} className="mr-1.5 translate-x-0.5" />
                Start Quiz
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────
   Difficulty colour helper
───────────────────────────────────────────── */
const difficultyClass = (difficulty) => {
  if (!difficulty) return "surface-elev text-app-muted";
  const d = difficulty.toLowerCase();
  if (d === "easy") return "bg-emerald-100 text-emerald-700";
  if (d === "medium") return "bg-amber-100 text-amber-700";
  if (d === "hard") return "bg-red-100 text-red-700";
  return "surface-elev text-app-muted";
};

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
const StatCard = ({ icon: Icon, iconColor, value, label, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: "easeOut" }}
    className="group flex flex-col items-center justify-center surface-subtle hover:surface border border-transparent hover:border-app hover:shadow-md rounded-2xl p-5 text-center transition-all duration-300 cursor-default select-none"
  >
    <div
      className={`w-10 h-10 flex items-center justify-center rounded-xl mb-3 transition-transform duration-300 group-hover:scale-110 ${iconColor}`}
    >
      <Icon size={20} />
    </div>
    <span className="text-2xl font-bold font-space-grotesk text-app leading-none mb-1">
      {value}
    </span>
    <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">
      {label}
    </span>
  </motion.div>
);

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
const QuizDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromAi = location.state?.from_ai;
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [startingQuiz, setStartingQuiz] = useState(false);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!id || id === "undefined" || id === "null") {
        console.error("quizId is undefined");
        setError("Invalid quiz ID.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await libraryService.getQuizById(id);
        setQuiz(data);
      } catch (err) {
        console.error("Error fetching quiz details:", err);
        setError("Failed to load quiz details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuizDetails();
  }, [id]);

  const handleStartQuiz = async () => {
    try {
      setStartingQuiz(true);
      const res = await attemptsService.startAttempt(quiz.id);
      navigate(`/attempts/${res.attempt_id || res.id}`, { state: { from_ai: fromAi } });
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("Failed to start quiz. Please try again.");
    } finally {
      setStartingQuiz(false);
      setShowModal(false);
    }
  };

  /* ── Loading — skeleton ── */
  if (loading) return <SkeletonPage />;

  /* ── Error ── */
  if (error || !quiz) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-app-muted gap-4">
        <p>{error || "Quiz not found"}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  /* ── Derived values (no mock data) ── */
  const title = quiz.title ?? quiz.quiz_title;
  const subject = quiz.category ?? quiz.subject ?? quiz.topic;
  const difficulty = quiz.difficulty;
  const questionType = quiz.question_type ?? quiz.type;
  const description = quiz.description;
  const questionCount =
    quiz.num_questions ??
    quiz.number_of_questions ??
    (Array.isArray(quiz.questions) ? quiz.questions.length : undefined);
  const timeLimit = quiz.time_limit ?? quiz.duration;
  const totalPoints = quiz.total_points ?? quiz.total_marks;
  const passingScore = quiz.passing_score ?? quiz.passing_percentage;
  const scoringInfo = quiz.scoring_info ?? quiz.scoring;
  const additionalInstructions = quiz.instructions;

  const { icon: LangIcon, color: iconColor } = getLanguageIcon(subject);

  /* ── Stats — only cards with real data ── */
  const stats = [
    { icon: FileText, iconColor: "bg-violet-100 text-violet-600", value: questionCount != null ? questionCount : null, label: "Questions" },
    { icon: Clock,    iconColor: "bg-blue-100 text-blue-600",     value: timeLimit != null ? `${timeLimit}m` : null,    label: "Time Limit" },
    { icon: CheckCircle, iconColor: "bg-emerald-100 text-emerald-600", value: totalPoints != null ? totalPoints : null, label: "Total Points" },
    { icon: Brain,    iconColor: "bg-amber-100 text-amber-600",   value: questionType ?? null,                          label: "Type" },
  ].filter((s) => s.value != null);

  const gridCols =
    stats.length === 4 ? "grid-cols-2 md:grid-cols-4" :
    stats.length === 3 ? "grid-cols-2 md:grid-cols-3" :
    stats.length === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <>
      {showModal && (
        <StartQuizModal
          quiz={quiz}
          onConfirm={handleStartQuiz}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="w-full max-w-4xl mx-auto pb-12 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Back to Library */}
          <button
            onClick={() => {
                if (fromAi) navigate("/dashboard");
                else navigate(-1);
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-app-muted hover:text-app transition-colors mb-6 group"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center surface-elev group-hover:bg-violet-100 group-hover:text-violet-600 transition-all duration-200">
              <ArrowLeft size={15} />
            </span>
            {fromAi ? "Back to Dashboard" : "Back to Library"}
          </button>

          <Card className="p-8 md:p-10 relative overflow-hidden shadow-sm border border-app">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400 rounded-t-3xl" />

            {/* ── Header ── */}
            <motion.div
              className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold font-space-grotesk text-app mb-3 leading-tight">
                  {title ?? "Untitled Quiz"}
                </h1>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border border-violet-200 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                    <Sparkles size={11} />
                    AI Generated
                  </span>
                  {subject && (
                    <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                      <LangIcon size={12} />
                      {subject}
                    </span>
                  )}
                  {difficulty && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${difficultyClass(difficulty)}`}>
                      {difficulty}
                    </span>
                  )}
                  {questionType && (
                    <span className="inline-flex items-center gap-1 surface-elev text-app-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                      {questionType}
                    </span>
                  )}
                </div>

                {description && (
                  <p className="text-app-2 text-base leading-relaxed max-w-2xl">
                    {description}
                  </p>
                )}
              </div>

              {passingScore != null && (
                <div className="flex-shrink-0">
                  <div className="surface-subtle border border-app rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px]">
                    <div className="text-app-muted text-xs font-bold uppercase tracking-wider mb-1">Passing Score</div>
                    <div className="text-3xl font-bold font-space-grotesk text-app">
                      {passingScore}<span className="text-lg text-app-muted">%</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <hr className="border-app mb-8" />

            {/* ── Stats Grid ── */}
            {stats.length > 0 && (
              <div className={`grid gap-4 mb-10 ${gridCols}`}>
                {stats.map((s, i) => (
                  <StatCard key={s.label} {...s} delay={0.1 + i * 0.06} />
                ))}
              </div>
            )}

            {/* ── Quiz Information (shown only when backend fields exist) ── */}
            {(description || scoringInfo) && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.35 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Info size={15} className="text-violet-400" />
                  <span className="text-xs font-bold text-app-muted uppercase tracking-widest">
                    Quiz Information
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {description && (
                    <div className="surface-subtle border border-app rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={15} className="text-violet-500" />
                        <span className="text-xs font-bold text-app-muted uppercase tracking-wider">About this Quiz</span>
                      </div>
                      <p className="text-app-2 text-sm leading-relaxed">{description}</p>
                    </div>
                  )}
                  {scoringInfo && (
                    <div className="surface-subtle border border-app rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={15} className="text-emerald-500" />
                        <span className="text-xs font-bold text-app-muted uppercase tracking-wider">Scoring</span>
                      </div>
                      <p className="text-app-2 text-sm leading-relaxed">{scoringInfo}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Instructions ── */}
            <motion.div
              className="bg-violet-50/60 border border-violet-100 rounded-2xl p-6 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.35 }}
            >
              <h3 className="font-bold text-app mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-violet-500 rounded-full inline-block" />
                Instructions
              </h3>
              <ul className="space-y-3 text-app-2 text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-400 mt-0.5 font-bold">•</span>
                  The timer will start immediately after clicking "Start Quiz".
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-400 mt-0.5 font-bold">•</span>
                  You cannot pause the quiz once it has started.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-400 mt-0.5 font-bold">•</span>
                  Make sure you have a stable internet connection before starting.
                </li>
                {additionalInstructions && (
                  <li className="flex items-start gap-2.5">
                    <span className="text-violet-400 mt-0.5 font-bold">•</span>
                    {additionalInstructions}
                  </li>
                )}
              </ul>
            </motion.div>

            {/* ── Action Buttons ── */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.52, duration: 0.35 }}
            >
              <Button variant="outline" onClick={() => {
                  if (fromAi) navigate("/dashboard");
                  else navigate(-1);
              }}>
                <ArrowLeft size={18} className="mr-2" />
                {fromAi ? "Back to Dashboard" : "Back to Library"}
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto min-w-[200px]"
                onClick={() => setShowModal(true)}
                disabled={startingQuiz}
              >
                {startingQuiz ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Play size={18} className="mr-2 translate-x-0.5" />
                )}
                {startingQuiz ? "Starting..." : "Start Quiz"}
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default QuizDetailsPage;
