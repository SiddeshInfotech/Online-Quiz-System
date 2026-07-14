import api from "./api";

const attemptsService = {
  /**
   * Fetch the user's attempt history along with aggregate stats.
   * GET /api/attempts/history/
   * Response shape: { stats: {...}, attempts: [...] }
   */
  getHistory: async () => {
    const response = await api.get("/attempts/history/");
    return response.data;
  },

  /**
   * Start a new attempt for a given quiz.
   * POST /api/quizzes/:quizId/start/
   * @param {string|number} quizId 
   * @returns {Promise<{ attempt_id: string|number, [key: string]: any }>}
   */
  startAttempt: async (quizId) => {
    const response = await api.post(`/quizzes/${quizId}/start/`);
    return response.data;
  },

  /**
   * Get an ongoing attempt (including questions and remaining_time_seconds).
   * GET /api/attempts/:attemptId/
   * @param {string|number} attemptId 
   */
  getAttempt: async (attemptId) => {
    const response = await api.get(`/attempts/${attemptId}/`);
    return response.data;
  },

  /**
   * Autosave a single answer or mark-for-review state.
   * POST /api/attempts/:attemptId/answer/
   * @param {string|number} attemptId 
   * @param {Object} data - { question_id, selected_option_id, is_marked_for_review }
   */
  saveAnswer: async (attemptId, data) => {
    const response = await api.post(`/attempts/${attemptId}/answer/`, data);
    return response.data;
  },

  /**
   * Submit the completed attempt for grading.
   * POST /api/attempts/:attemptId/submit/
   * @param {string|number} attemptId 
   */
  submitAttempt: async (attemptId, data) => {
    const response = await api.post(`/attempts/${attemptId}/submit/`, data);
    return response.data;
  },
  /**
   * Get the detailed result of a submitted attempt.
   * GET /api/attempts/:attemptId/result/
   * @param {string|number} attemptId 
   */
  getAttemptResult: async (attemptId) => {
    const response = await api.get(`/attempts/${attemptId}/result/`);
    return response.data;
  },

  /**
   * Get the review details of a submitted attempt.
   * GET /api/attempts/:attemptId/review/
   * @param {string|number} attemptId 
   */
  getAttemptReview: async (attemptId) => {
    const response = await api.get(`/attempts/${attemptId}/review/`);
    return response.data;
  },
};

export default attemptsService;
