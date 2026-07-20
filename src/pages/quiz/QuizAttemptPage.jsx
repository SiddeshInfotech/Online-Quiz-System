import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import attemptsService from "../../services/attemptsService";
import Button from "../../components/ui/Button";

// Components
import QuizHeader from "./components/QuizHeader";
import QuestionCard from "./components/QuestionCard";
import QuestionPalette from "./components/QuestionPalette";
import MobileDrawer from "./components/MobileDrawer";
import SubmitModal from "./components/SubmitModal";
import ExitModal from "./components/ExitModal";

const QuizAttemptPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(location.state?.startIndex || 0);
  const [answers, setAnswers] = useState({}); // { question_id: option_id }
  const [markedForReview, setMarkedForReview] = useState({}); // { question_index: boolean }
  
  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  // Modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Autosave status state
  // 'idle' | 'saving' | 'saved' | 'error'
  const [autosaveStatus, setAutosaveStatus] = useState("idle");

  // Refs for tracking latest values in listeners/callbacks
  const timerRef = useRef(null);
  const attemptIdRef = useRef(attemptId);
  const currentQIdRef = useRef(null);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const fetchAttempt = useCallback(async () => {
    if (!attemptId || attemptId === "undefined" || attemptId === "null") {
      console.error("attemptId is undefined");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await attemptsService.getAttempt(attemptId);
      
      // Redirect if attempt is already submitted/completed
      if (data.status === 'completed' || data.status === 'expired' || data.is_completed) {
        navigate(`/results/${attemptId}`, { replace: true, state: { message: "This attempt has already been submitted or expired." } });
        return;
      }

      setAttempt(data);
      // Assuming questions are in data.questions
      const qs = data.questions || [];
      setQuestions(qs);
      
      // If there are existing answers, populate them
      if (data.answers) {
        const initialAnswers = {};
        const initialMarked = {};
        data.answers.forEach((ans) => {
          initialAnswers[ans.question_id] = ans.selected_option_id;
          if (ans.marked_for_review ?? ans.is_marked_for_review) {
            const qIdx = qs.findIndex(q => q.id === ans.question_id);
            if (qIdx !== -1) initialMarked[qIdx] = true;
          }
        });
        setAnswers(initialAnswers);
        setMarkedForReview(initialMarked);
      }

      // Initialize Timer
      const finalRemainingTime = data.remaining_time_seconds ?? location.state?.remainingTime;
      if (finalRemainingTime != null) {
        setRemainingSeconds(finalRemainingTime);
        setIsTimerRunning(true);
      }

    } catch (err) {
      console.error("Failed to load attempt", err);
      // Fallback or error state
    } finally {
      setIsLoading(false);
    }
  }, [attemptId, navigate, location.state]);

  useEffect(() => {
    fetchAttempt();
    return () => clearInterval(timerRef.current);
  }, [fetchAttempt]);

  // Timer Effect
  useEffect(() => {
    if (!isTimerRunning || remainingSeconds === null) return;

    if (remainingSeconds <= 0) {
      setIsTimerRunning(false);
      handleFinalSubmit(); // Auto-submit when time is up
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, remainingSeconds]);

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // -- Actions --
  const performAutosave = useCallback(async (questionId, optionId, marked) => {
    const payload = {
      question_id: questionId,
      selected_option_id: optionId || null,
      marked_for_review: !!marked
    };
    
    try {
      setAutosaveStatus("saving");
      await attemptsService.saveAnswer(attemptId, payload);
      setAutosaveStatus("saved");
      
      // Hide "Saved" after 2s
      setTimeout(() => {
        setAutosaveStatus((prev) => prev === "saved" ? "idle" : prev);
      }, 2000);
    } catch (err) {
      console.error("Autosave failed", err);
      setAutosaveStatus("error");
    }
  }, [attemptId]);

  const handleSelectOption = useCallback((optionId) => {
    const qId = questions[currentIndex].id;
    setAnswers((prev) => {
      const newAnswers = { ...prev, [qId]: optionId };
      console.log("Selected question:", qId);
      console.log("Selected option:", optionId);
      console.log("Updated answers:", newAnswers);
      return newAnswers;
    });
    performAutosave(qId, optionId, markedForReview[currentIndex]);
  }, [questions, currentIndex, markedForReview, performAutosave]);

  const handleClearAnswer = useCallback(() => {
    const qId = questions[currentIndex].id;
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);
    performAutosave(qId, null, markedForReview[currentIndex]);
  }, [questions, currentIndex, answers, markedForReview, performAutosave]);

  const handleToggleReview = useCallback(() => {
    const qId = questions[currentIndex].id;
    const isMarked = !markedForReview[currentIndex];
    setMarkedForReview((prev) => ({ ...prev, [currentIndex]: isMarked }));
    performAutosave(qId, answers[qId], isMarked);
  }, [questions, currentIndex, markedForReview, answers, performAutosave]);

  const smoothScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus the question heading for accessibility
    setTimeout(() => {
      const heading = document.getElementById("question-heading");
      if (heading) heading.focus({ preventScroll: true });
    }, 300);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      smoothScrollToTop();
    } else {
      setShowSubmitModal(true);
    }
  }, [currentIndex, questions.length, smoothScrollToTop]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      smoothScrollToTop();
    }
  }, [currentIndex, smoothScrollToTop]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLoading || showSubmitModal || showExitModal) return;

      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (["1", "2", "3", "4"].includes(e.key)) {
        const optionIndex = parseInt(e.key) - 1;
        const currentQ = questions[currentIndex];
        if (currentQ && currentQ.options && currentQ.options[optionIndex]) {
          handleSelectOption(currentQ.options[optionIndex].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, showSubmitModal, showExitModal, currentIndex, questions, handleNext, handlePrev, handleSelectOption]);

  // Sync ref for current question id
  useEffect(() => {
    if (questions.length > 0) {
      currentQIdRef.current = questions[currentIndex]?.id;
    }
  }, [currentIndex, questions]);

  const handleNavigatePalette = (index) => {
    setCurrentIndex(index);
    smoothScrollToTop();
  };

  // -- Submission Logic --
  
  const calculateStats = () => {
    const answeredCount = Object.keys(answers).length;
    return {
      total: questions.length,
      answered: answeredCount,
      unanswered: questions.length - answeredCount,
      marked: Object.keys(markedForReview).filter(k => markedForReview[k]).length,
    };
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmitting(true);
    setSubmitError(null);
    setIsTimerRunning(false); // Stop timer visually

    // Use ref to capture the latest answers snapshot (important for auto-submit on timer expiry)
    const actualAnswers = answersRef.current || answers;

    const payload = {
      answers: Object.entries(actualAnswers).map(([qId, optId]) => ({
        question_id: parseInt(qId, 10),
        selected_option_id: optId
      }))
    };

    try {
      // Backend now returns only { status, attempt_id, result_id }
      // Do not use the response body — navigate to result page which fetches its own data
      await attemptsService.submitAttempt(attemptId, payload);
      navigate(`/results/${attemptId}`, { replace: true });
    } catch (err) {
      console.error("Submission failed", err);
      setSubmitError(err.response?.data?.message || "Failed to submit quiz. Please try again.");
      setIsSubmitting(false);

      if (remainingSeconds > 0) {
        setIsTimerRunning(true); // Resume timer if submit failed and time remains
      }
    }
  };

  // -- Render Helpers --
  const currentQuestion = questions[currentIndex];
  const hasAnsweredAny = Object.keys(answers).length > 0;

  return (
    <div className="min-h-screen surface-subtle font-inter pb-20 lg:pb-8">
      {/* Modals */}
      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleFinalSubmit}
        isSubmitting={isSubmitting}
        stats={calculateStats()}
        error={submitError}
      />
      <ExitModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => navigate("/dashboard")}
        hasAnsweredAny={hasAnsweredAny}
      />

      <QuizHeader
        quizTitle={attempt?.quiz_title || attempt?.title}
        currentQuestionIndex={currentIndex}
        totalQuestions={questions.length}
        remainingSeconds={remainingSeconds}
        onExit={() => setShowExitModal(true)}
        isLoading={isLoading}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Col: Question & Navigation */}
        <div className="flex-1 w-full flex flex-col gap-6">
          
          {/* Autosave Indicator */}
          <div className="h-6 flex items-center justify-end">
             {autosaveStatus === "saving" && (
                <span className="text-xs font-medium text-app-muted flex items-center gap-1.5 animate-pulse">
                  <div className="w-3 h-3 border-2 border-app border-t-slate-500 rounded-full animate-spin" />
                  Saving...
                </span>
             )}
             {autosaveStatus === "saved" && (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <Check size={14} /> Saved
                </span>
             )}
             {autosaveStatus === "error" && (
                <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                  Couldn't save. Retrying...
                </span>
             )}
          </div>

          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            selectedOptionId={currentQuestion ? answers[currentQuestion.id] : null}
            isMarkedForReview={!!markedForReview[currentIndex]}
            onSelectOption={handleSelectOption}
            onClearAnswer={handleClearAnswer}
            onToggleReview={handleToggleReview}
            isLoading={isLoading}
          />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
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
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {currentIndex === questions.length - 1 ? (
                "Submit Quiz"
              ) : (
                <>
                  Next
                  <ChevronRight size={18} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Col: Desktop Palette */}
        <div className="hidden lg:block w-80 flex-shrink-0 sticky top-[100px]">
          <QuestionPalette
            totalQuestions={questions.length}
            currentQuestionIndex={currentIndex}
            answers={answers}
            markedForReview={markedForReview}
            onNavigate={handleNavigatePalette}
            isLoading={isLoading}
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
        markedForReview={markedForReview}
        onNavigate={handleNavigatePalette}
      />
    </div>
  );
};

export default QuizAttemptPage;
