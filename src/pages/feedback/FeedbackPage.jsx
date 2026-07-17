import React, { useState, useEffect } from 'react';
import { AlertCircle, MessageSquarePlus, CheckCircle2 } from 'lucide-react';
import feedbackService from '../../services/feedbackService';
import RatingDistribution from './components/RatingDistribution';
import FeedbackCard from './components/FeedbackCard';
import StarRating from './components/StarRating';
import Button from '../../components/ui/Button/Button';

const FeedbackPage = () => {
  const [summary, setSummary] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, feedbackRes, myFeedbackRes] = await Promise.all([
        feedbackService.getSummary(),
        feedbackService.getFeedback(),
        feedbackService.getMyFeedback().catch(() => null) // Ignore error if no previous feedback
      ]);

      setSummary(summaryRes);
      setFeedbacks(Array.isArray(feedbackRes) ? feedbackRes : feedbackRes.results || []); 6

      if (myFeedbackRes) {
        setRating(myFeedbackRes.rating || 0);
        setMessage(myFeedbackRes.message || '');
      }
    } catch (err) {
      console.error("Failed to fetch feedback data:", err);
      setError("Failed to load feedback. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (rating === 0) {
      setSubmitError("Please select a rating.");
      return;
    }

    if (message.trim().length < 10) {
      setSubmitError("Feedback message must be at least 10 characters long.");
      return;
    }

    if (message.length > 1000) {
      setSubmitError("Feedback message cannot exceed 1000 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackService.submitFeedback({ rating, message });
      setSubmitSuccess(true);

      // Clear the form state explicitly as requested
      setRating(0);
      setMessage('');

      // Refresh the data to show the new summary and the updated list
      await fetchData();

      // Hide success toast after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error("Submit feedback error:", err);
      setSubmitError(err.response?.data?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-48 bg-slate-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="h-96 bg-slate-200 rounded-2xl lg:col-span-7"></div>
          <div className="h-96 bg-slate-200 rounded-2xl lg:col-span-5"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Oops! Something went wrong</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={fetchData} className="mt-6">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Community Feedback</h1>
        <p className="text-slate-500">
          See how learners rate QuizGen AI and share your own experience.
        </p>
      </div>

      {/* Section 1: Overall Rating Summary */}
      <div className="mb-8">
        <RatingDistribution summary={summary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Section 2: Recent Community Feedback */}
        <div className="lg:col-span-7">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquarePlus className="text-violet-600" size={24} />
            Recent Feedback
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
            {feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <FeedbackCard key={fb.id} feedback={fb} />
              ))
            ) : (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
                <p className="text-slate-500">No feedback available yet. Be the first to share yours!</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Submit Your Feedback */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Share Your Feedback</h2>

            {submitSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 text-sm">
                <CheckCircle2 size={18} />
                Feedback submitted successfully!
              </div>
            )}

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={18} />
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  size={32}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all resize-none bg-slate-50 focus:bg-white"
                  rows={5}
                  placeholder="Tell us what you liked, what can be improved, or report an issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className={`text-right text-xs mt-1 ${message.length > 1000 ? 'text-red-500' : 'text-slate-400'}`}>
                  {message.length} / 1000
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
