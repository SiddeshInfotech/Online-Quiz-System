import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import attemptsService from "../../services/attemptsService";
import Button from "../../components/ui/Button";

// Components
import ResultHero from "./components/results/ResultHero";
import ResultStats from "./components/results/ResultStats";
import PerformanceSummary from "./components/results/PerformanceSummary";
import ScoreBreakdown from "./components/results/ScoreBreakdown";
import QuizInfoCard from "./components/results/QuizInfoCard";
import ResultActions from "./components/results/ResultActions";

const QuizResultsPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

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

  const handleRetry = async () => {
    if (!result?.quiz?.id) return;
    try {
      const res = await attemptsService.startAttempt(result.quiz.id);
      navigate(`/attempts/${res.attempt_id || res.id}`);
    } catch (err) {
      console.error("Failed to retry quiz", err);
      alert("Failed to start a new attempt. Please try again later.");
    }
  };

  const handleReview = () => {
    navigate(`/results/${attemptId}/review`);
  };

  const handleBackToLibrary = () => {
    navigate("/library");
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
    <div className="min-h-screen surface-subtle font-inter py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
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
            <QuizInfoCard result={result} isLoading={isLoading} />
          </div>
        </div>

        {/* Actions */}
        <ResultActions 
          onRetry={handleRetry}
          onReview={handleReview}
          onBackToLibrary={handleBackToLibrary}
          isLoading={isLoading}
        />
        
      </div>
    </div>
  );
};

export default QuizResultsPage;
