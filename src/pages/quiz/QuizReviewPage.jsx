import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw, FileText } from "lucide-react";
import attemptsService from "../../services/attemptsService";
import Button from "../../components/ui/Button";

// Components
import QuizHeader from "./components/QuizHeader";
import QuestionCard from "./components/QuestionCard";
import QuestionPalette from "./components/QuestionPalette";
import MobileDrawer from "./components/MobileDrawer";

/**
 * Normalize review question object according to latest backend review contract.
 */
const normalizeReviewQuestion = (q, idx) => {
  if (!q) return null;

  const question_id = q.question_id ?? q.id ?? idx + 1;
  const question_text = q.question_text ?? q.text ?? "";

  // Normalize options: string array or object array into resilient objects
  let options = [];
  if (Array.isArray(q.options)) {
    options = q.options.map((opt, i) => {
      if (typeof opt === "string") {
        return { id: String(i), text: opt, value: opt };
      } else if (typeof opt === "object" && opt !== null) {
        const optText = opt.text ?? opt.option_text ?? opt.value ?? String(opt.id || "");
        return { id: String(opt.id ?? i), text: optText, value: optText };
      }
      return { id: String(i), text: String(opt), value: String(opt) };
    });
  }

  const selected_answer = q.selected_answer ?? q.user_answer ?? (q.selected_option ? (q.selected_option.text || q.selected_option) : "");
  const correct_answer = q.correct_answer ?? (q.correct_option ? (q.correct_option.text || q.correct_option) : "");
  const is_correct = q.is_correct !== undefined ? q.is_correct : (selected_answer !== "" && selected_answer === correct_answer);
  const explanation = q.explanation ?? q.ai_explanation ?? "";

  return {
    ...q,
    id: question_id,
    question_id,
    question_text,
    options,
    selected_answer,
    correct_answer,
    is_correct,
    explanation,
  };
};

const QuizReviewPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // State
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const fetchReview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await attemptsService.getAttemptReview(attemptId);
      setAttempt(data);

      const rawQuestions = Array.isArray(data)
        ? data
        : Array.isArray(data.questions)
        ? data.questions
        : Array.isArray(data.review)
        ? data.review
        : [];

      const normalized = rawQuestions.map(normalizeReviewQuestion).filter(Boolean);
      setQuestions(normalized);
    } catch (err) {
      console.error("Failed to load review", err);
      setError("Unable to load review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  const smoothScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const heading = document.getElementById("question-heading");
      if (heading) heading.focus({ preventScroll: true });
    }, 300);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      smoothScrollToTop();
    }
  }, [currentIndex, questions.length, smoothScrollToTop]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      smoothScrollToTop();
    }
  }, [currentIndex, smoothScrollToTop]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLoading || questions.length === 0) return;

      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, questions.length, handleNext, handlePrev]);

  const handleNavigatePalette = (index) => {
    setCurrentIndex(index);
    smoothScrollToTop();
  };

  const currentQuestion = questions[currentIndex];

  // 10. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen surface-subtle font-inter flex flex-col">
        <QuizHeader
          quizTitle="Quiz Review"
          currentQuestionIndex={0}
          totalQuestions={0}
          onExit={() => navigate(`/results/${attemptId}`)}
          exitText="Back to Results"
          isLoading={true}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-app-muted font-medium text-lg">Loading review...</p>
        </div>
      </div>
    );
  }

  // 10. Error State
  if (error) {
    return (
      <div className="min-h-screen surface-subtle font-inter flex flex-col">
        <QuizHeader
          quizTitle="Quiz Review"
          currentQuestionIndex={0}
          totalQuestions={0}
          onExit={() => navigate(`/results/${attemptId}`)}
          exitText="Back to Results"
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-app mb-2">Unable to load review</h2>
          <p className="text-app-muted text-sm mb-6">Unable to load review. Please try again.</p>
          <Button variant="primary" onClick={fetchReview} className="gap-2">
            <RefreshCw size={16} /> Retry
          </Button>
        </div>
      </div>
    );
  }

  // 9. Empty State (questions.length === 0)
  if (questions.length === 0) {
    return (
      <div className="min-h-screen surface-subtle font-inter flex flex-col">
        <QuizHeader
          quizTitle={attempt?.quiz_title || attempt?.title || "Quiz Review"}
          currentQuestionIndex={0}
          totalQuestions={0}
          onExit={() => navigate(`/results/${attemptId}`)}
          exitText="Back to Results"
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 surface-elev text-violet-600 rounded-2xl flex items-center justify-center mb-4 border border-app shadow-sm">
            <FileText size={32} />
          </div>
          <h2 className="text-xl font-bold text-app mb-2">No review data available</h2>
          <p className="text-app-muted text-sm mb-6">No review data available for this attempt.</p>
          <Button variant="secondary" onClick={() => navigate(`/results/${attemptId}`)}>
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-subtle font-inter pb-20 lg:pb-8">
      <QuizHeader
        quizTitle={attempt?.quiz_title || attempt?.title || "Quiz Review"}
        currentQuestionIndex={currentIndex}
        totalQuestions={questions.length}
        remainingSeconds={null}
        onExit={() => navigate(`/results/${attemptId}`)}
        exitText="Back to Results"
        isLoading={false}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Col: Question & Navigation */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            selectedOptionId={null}
            isMarkedForReview={false} 
            onSelectOption={() => {}} 
            onClearAnswer={() => {}} 
            onToggleReview={() => {}} 
            isLoading={false}
            reviewMode={true}
          />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 sticky bottom-16 lg:static lg:bottom-auto surface-subtle p-4 lg:p-0 z-30 lg:z-auto border-t border-app lg:border-none shadow-[0_-10px_15px_-3px_rgba(248,250,252,1)] lg:shadow-none">
            <Button
              variant="secondary"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="min-w-[120px]"
            >
              <ChevronLeft size={18} className="mr-1" />
              Previous
            </Button>

            <Button
              variant="primary"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="min-w-[120px]"
            >
              Next
              <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        </div>

        {/* Right Col: Desktop Palette */}
        <div className="hidden lg:block w-80 flex-shrink-0 sticky top-[100px]">
          <QuestionPalette
            totalQuestions={questions.length}
            currentQuestionIndex={currentIndex}
            answers={{}}
            markedForReview={{}}
            onNavigate={handleNavigatePalette}
            isLoading={false}
            reviewMode={true}
            questions={questions}
          />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        setIsOpen={setIsMobileDrawerOpen}
        totalQuestions={questions.length}
        currentQuestionIndex={currentIndex}
        answers={{}}
        markedForReview={{}}
        onNavigate={handleNavigatePalette}
        reviewMode={true}
        questions={questions}
      />
    </div>
  );
};

export default QuizReviewPage;
