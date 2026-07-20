import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import attemptsService from "../../services/attemptsService";
import Button from "../../components/ui/Button";

// Components
import QuizHeader from "./components/QuizHeader";
import QuestionCard from "./components/QuestionCard";
import QuestionPalette from "./components/QuestionPalette";
import MobileDrawer from "./components/MobileDrawer";

const QuizReviewPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // State
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { question_id: option_id }
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const fetchReview = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await attemptsService.getAttemptReview(attemptId);
      
      setAttempt(data);
      const qs = data.questions || [];
      setQuestions(qs);
      
      if (data.answers) {
        const initialAnswers = {};
        data.answers.forEach((ans) => {
          initialAnswers[ans.question_id] = ans.selected_option_id;
        });
        setAnswers(initialAnswers);
      } else {
         const initialAnswers = {};
         qs.forEach(q => {
             if (q.selected_option_id) initialAnswers[q.id] = q.selected_option_id;
         });
         setAnswers(initialAnswers);
      }

    } catch (err) {
      console.error("Failed to load review", err);
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
      if (isLoading) return;

      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, handleNext, handlePrev]);

  const handleNavigatePalette = (index) => {
    setCurrentIndex(index);
    smoothScrollToTop();
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen surface-subtle font-inter pb-20 lg:pb-8">
      <QuizHeader
        quizTitle={attempt?.quiz_title || attempt?.title || "Quiz Review"}
        currentQuestionIndex={currentIndex}
        totalQuestions={questions.length}
        remainingSeconds={null}
        onExit={() => navigate(`/results/${attemptId}`)}
        exitText="Back to Results"
        isLoading={isLoading}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Col: Question & Navigation */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            selectedOptionId={currentQuestion ? answers[currentQuestion.id] : null}
            isMarkedForReview={false} 
            onSelectOption={() => {}} 
            onClearAnswer={() => {}} 
            onToggleReview={() => {}} 
            isLoading={isLoading}
            reviewMode={true}
          />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 sticky bottom-16 lg:static lg:bottom-auto surface-subtle p-4 lg:p-0 z-30 lg:z-auto border-t border-app lg:border-none shadow-[0_-10px_15px_-3px_rgba(248,250,252,1)] lg:shadow-none">
            <Button
              variant="secondary"
              onClick={handlePrev}
              disabled={currentIndex === 0 || isLoading}
              className="min-w-[120px]"
            >
              <ChevronLeft size={18} className="mr-1" />
              Previous
            </Button>

            <Button
              variant="primary"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1 || isLoading}
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
            answers={answers}
            markedForReview={{}}
            onNavigate={handleNavigatePalette}
            isLoading={isLoading}
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
        answers={answers}
        markedForReview={{}}
        onNavigate={handleNavigatePalette}
        reviewMode={true}
        questions={questions}
      />
    </div>
  );
};

export default QuizReviewPage;
