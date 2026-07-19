import React, { useState, useEffect } from 'react';
import { AlertCircle, MessageSquarePlus, CheckCircle2, Edit2, PlusCircle } from 'lucide-react';
import feedbackService from '../../services/feedbackService';
import achievementService from '../../services/achievementService';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [maxAllowed, setMaxAllowed] = useState(2);

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
      setFeedbacks(Array.isArray(feedbackRes) ? feedbackRes : feedbackRes.results || []);

      if (myFeedbackRes && Array.isArray(myFeedbackRes.results)) {
        setMyFeedbacks(myFeedbackRes.results);
        setMaxAllowed(myFeedbackRes.max_allowed || 2);
        
        // Preserve edit mode if currently editing
        let currentlyEditing = null;
        setEditingId((prevId) => {
          currentlyEditing = myFeedbackRes.results.find(f => f.id === prevId);
          return currentlyEditing ? prevId : null;
        });
        
        if (currentlyEditing) {
          setRating(currentlyEditing.rating || 0);
          setMessage(currentlyEditing.message || '');
          setIsEditing(true);
        } else if (myFeedbackRes.results.length >= (myFeedbackRes.max_allowed || 2)) {
          // If max reached and not already editing one, default to editing the first one
          const firstFb = myFeedbackRes.results[0];
          setEditingId(firstFb.id);
          setRating(firstFb.rating || 0);
          setMessage(firstFb.message || '');
          setIsEditing(true);
        } else {
          // If < max allowed and not currently editing, default to new
          setEditingId(null);
          setRating(0);
          setMessage('');
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch feedback data:", err);
      setError("Failed to load feedback. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (fb) => {
    setEditingId(fb.id);
    setRating(fb.rating || 0);
    setMessage(fb.message || '');
    setIsEditing(true);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleWriteNewClick = () => {
    setEditingId(null);
    setRating(0);
    setMessage('');
    setIsEditing(false);
    setSubmitError(null);
    setSubmitSuccess(false);
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
      let res;
      if (isEditing && editingId) {
        res = await feedbackService.updateFeedback(editingId, { rating, message });
      } else {
        res = await feedbackService.submitFeedback({ rating, message });
      }
      setSubmitSuccess(true);
      
      if (res.updated || (isEditing && editingId)) {
        setSuccessMessage("Feedback updated successfully.");
      } else if (res.created || !isEditing) {
        setSuccessMessage("Feedback submitted successfully.");
      } else {
        setSuccessMessage(isEditing ? "Feedback updated successfully." : "Feedback submitted successfully.");
      }

      // Refresh feedback data to show new summary and updated list
      await fetchData();

      // Trigger server-side badge evaluation so Feedback Hero badge
      // becomes CLAIMABLE immediately on next achievements page visit.
      // Fire-and-forget — checkUnlock() swallows its own errors.
      achievementService.checkUnlock();

      // Hide success toast after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error("Submit feedback error:", err);
      if (err.response?.status === 403) {
        setSubmitError("You have reached the maximum of 2 feedbacks. Please edit an existing feedback.");
      } else {
        setSubmitError(err.response?.data?.message || "Failed to submit feedback. Please try again.");
      }
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
        <p className="text-app-muted">{error}</p>
        <Button onClick={fetchData} className="mt-6">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-app mb-2">Community Feedback</h1>
        <p className="text-app-muted">
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
          <h2 className="text-xl font-bold text-app mb-4 flex items-center gap-2">
            <MessageSquarePlus className="text-violet-600" size={24} />
            Recent Feedback
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
            {feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <FeedbackCard key={fb.id} feedback={fb} />
              ))
            ) : (
              <div className="surface-subtle rounded-2xl p-8 text-center border border-slate-100">
                <p className="text-app-muted">No feedback available yet. Be the first to share yours!</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Submit Your Feedback */}
        <div className="lg:col-span-5">
          <div className="surface p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
            <h2 className="text-xl font-bold text-app mb-4">Share Your Feedback</h2>

            {myFeedbacks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-app-2 mb-3">Your Feedbacks</h3>
                <div className="space-y-3">
                  {myFeedbacks.map(fb => (
                    <div key={fb.id} className={`p-4 rounded-xl border transition-all ${editingId === fb.id ? 'border-violet-500 bg-violet-50/10 shadow-sm' : 'border-app surface-subtle'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <StarRating rating={fb.rating} size={16} readOnly />
                        <span className="text-[11px] text-app-muted font-medium">
                          {fb.created_at === fb.updated_at ? "Posted" : "Edited"} {new Date(fb.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-app-2 line-clamp-2 mb-3">{fb.message}</p>
                      <Button
                        variant={editingId === fb.id ? "primary" : "secondary"}
                        size="sm"
                        className="w-full text-xs h-8"
                        onClick={() => handleEditClick(fb)}
                      >
                        {editingId === fb.id ? "Currently Editing" : "Edit"}
                      </Button>
                    </div>
                  ))}
                </div>
                {myFeedbacks.length < maxAllowed && (
                  <Button
                    variant={editingId === null ? "primary" : "secondary"}
                    className="w-full mt-3 text-sm"
                    onClick={handleWriteNewClick}
                  >
                    Write New Feedback
                  </Button>
                )}
                <div className="h-px w-full bg-slate-100 my-6" />
              </div>
            )}

            {submitSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 text-sm">
                <CheckCircle2 size={18} />
                {successMessage}
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
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  size={32}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Your Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full rounded-xl border border-app p-4 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all resize-none surface-subtle focus:surface"
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
                {isSubmitting ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Feedback' : 'Submit Feedback')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
