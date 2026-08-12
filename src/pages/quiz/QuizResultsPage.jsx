import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import attemptsService from "../../services/attemptsService";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { getCurrentPlan } from "../pricing/PricingPage";

import { ArrowLeft } from "lucide-react";
import ResultHero from "./components/results/ResultHero";
import ResultStats from "./components/results/ResultStats";
import PerformanceSummary from "./components/results/PerformanceSummary";
import ScoreBreakdown from "./components/results/ScoreBreakdown";
import QuizInfoCard from "./components/results/QuizInfoCard";
import ResultActions from "./components/results/ResultActions";

const QuizResultsPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Always fetch the result from the API — never rely on submit response state.
  // The submit endpoint now returns only { status, attempt_id, result_id }.
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResult = useCallback(async () => {
    if (!attemptId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await attemptsService.getAttemptResult(attemptId);
      setResult(data);
    } catch (err) {
      console.error("Failed to fetch results", err);
      setError("Failed to load quiz results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const [actionError, setActionError] = useState(null);

  // Plan & Tier Check: Free = 1 attempt total (0 retries), Pro = 2 attempts total (1 retry)
  const userPlan = (getCurrentPlan(currentUser) || "free").toLowerCase();
  const isPro = userPlan === "pro" || userPlan === "premium" || Boolean(currentUser?.is_pro || currentUser?.is_premium || currentUser?.subscription?.is_pro);

  const maxAttempts = isPro ? 2 : 1;
  const rawAttemptCount = result?.attempt_count ?? result?.quiz?.attempt_count ?? 1;
  const attemptCount = Math.min(rawAttemptCount, maxAttempts);
  const canRetry = isPro ? (rawAttemptCount < maxAttempts && result?.can_retry !== false) : false;

  const handleRetry = async () => {
    const quizId = result?.quiz?.id || result?.quiz_id;
    if (!quizId) return;
    try {
      setActionError(null);
      const res = await attemptsService.startAttempt(quizId);
      navigate(`/attempts/${res.attempt_id || res.id}`);
    } catch (err) {
      console.error("Failed to retry quiz", err);
      if (err.response?.status === 403) {
        if (err.response?.data?.code === "PREMIUM_REQUIRED") {
          // Interceptor handles triggering the Pro Upgrade Modal automatically
          return;
        }
        setActionError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Maximum attempt limit reached."
        );
      } else {
        setActionError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to start a new attempt. Please try again later."
        );
      }
      setTimeout(() => setActionError(null), 5000);
    }
  };

  const handleReview = () => {
    navigate(`/results/${attemptId}/review`);
  };

  const location = useLocation();

  const isAiQuiz = Boolean(
    location.state?.from_ai ||
    result?.quiz?.is_ai_generated ||
    result?.quiz?.is_ai ||
    result?.is_ai_generated ||
    result?.is_ai ||
    (typeof result?.quiz?.quiz_type === "string" && result.quiz.quiz_type.toLowerCase().includes("ai")) ||
    (typeof result?.quiz?.source === "string" && result.quiz.source.toLowerCase().includes("ai")) ||
    (typeof result?.quiz?.type === "string" && result.quiz.type.toLowerCase().includes("ai")) ||
    result?.quiz?.created_by_ai
  );

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 text-red-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-app mb-2">Something went wrong</h2>
        <p className="text-app-muted mb-6">{error}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
          <Button variant="primary" onClick={fetchResult}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Calculate percentage for performance summary
  const percentage = result?.percentage ?? 0;

  return (
    <div className="min-h-screen surface-subtle font-inter pb-16 py-8 px-4 md:px-8">
      {actionError && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-red-600 text-white text-xs font-semibold shadow-xl max-w-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-white hover:opacity-80 font-bold">&times;</button>
        </div>
      )}
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToDashboard}
            className="inline-flex items-center gap-2 text-sm font-semibold text-app hover:text-violet-600 surface border border-app rounded-xl px-4 py-2 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header Section */}
        <ResultHero result={result} isLoading={isLoading} />

        {/* Stats Grid */}
        <ResultStats result={result} isLoading={isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Performance & Breakdown) */}
          <div className="lg:col-span-2 space-y-6">
            <PerformanceSummary percentage={percentage} isLoading={isLoading} />
            <ScoreBreakdown result={result} isLoading={isLoading} />
          </div>

          {/* Right Column (Info Card) */}
          <div className="lg:col-span-1">
            <QuizInfoCard
              result={result}
              isLoading={isLoading}
              isPro={isPro}
              attemptCount={attemptCount}
              maxAttempts={maxAttempts}
            />
          </div>
        </div>

        {/* Actions */}
        <ResultActions
          isPro={isPro}
          canRetry={canRetry}
          attemptCount={attemptCount}
          maxAttempts={maxAttempts}
          onRetry={handleRetry}
          onReview={handleReview}
          onBackToLibrary={handleBackToDashboard}
          isLoading={isLoading}
          returnLabel="Back to Dashboard"
        />

      </div>
    </div>
  );
};

export default QuizResultsPage;
