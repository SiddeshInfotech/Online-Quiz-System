import axios from "axios";
import customAdminService from "./customAdminService";
import adminFeedbackService from "./adminFeedbackService";

/**
 * Dedicated Axios instance for Custom Admin Panel.
 * Uses admin_token from localStorage.
 */
const BASE_URL = import.meta.env.VITE_API_URL || "https://online-quiz-system-9vlk.onrender.com/api/";

const adminApi = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach admin_token
adminApi.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized by emitting admin_auth:logout
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new CustomEvent("admin_auth:logout"));
    }
    return Promise.reject(error);
  }
);

const adminService = {
  /**
   * Admin Authentication
   * POST /custom_admin/auth/login/ or fallback /auth/admin-login/ or /auth/login/
   */
  adminLogin: async (credentials) => {
    try {
      const res = await adminApi.post("custom_admin/auth/login/", credentials);
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        try {
          const fallbackRes = await adminApi.post("auth/admin-login/", credentials);
          return fallbackRes.data;
        } catch (_) {
          const loginRes = await adminApi.post("auth/login/", credentials);
          return loginRes.data;
        }
      }
      throw err;
    }
  },

  /**
   * Dashboard Analytics
   * GET /custom_admin/analytics/
   */
  getAnalytics: async () => {
    const response = await adminApi.get("custom_admin/analytics/");
    return response.data;
  },

  /**
   * User Management
   * GET /custom_admin/users/
   */
  getUsers: async (params = {}) => {
    const response = await adminApi.get("custom_admin/users/", { params });
    return response.data;
  },

  /**
   * Suspend User
   * POST /custom_admin/users/{userId}/suspend/
   */
  suspendUser: async (userId, reason = "") => {
    const response = await adminApi.post(`custom_admin/users/${userId}/suspend/`, { reason });
    return response.data;
  },

  /**
   * Activate User
   * POST /custom_admin/users/{userId}/activate/
   */
  activateUser: async (userId) => {
    const response = await adminApi.post(`custom_admin/users/${userId}/activate/`);
    return response.data;
  },

  /**
   * Quiz Moderation
   * GET /custom_admin/quizzes/
   */
  getQuizzes: (params) => customAdminService.getQuizzes(params),

  /**
   * Create Quiz
   * POST /custom_admin/quizzes/
   */
  createQuiz: (payload) => customAdminService.createQuiz(payload),

  /**
   * Update Quiz
   * PUT /custom_admin/quizzes/{quizId}/
   */
  updateQuiz: (quizId, payload) => customAdminService.updateQuiz(quizId, payload),

  /**
   * Delete Quiz
   * DELETE /custom_admin/quizzes/{quizId}/
   */
  deleteQuiz: (quizId) => customAdminService.deleteQuiz(quizId),

  /**
   * Archive Quiz (Legacy method mapped to deleteQuiz)
   */
  archiveQuiz: (quizId) => customAdminService.deleteQuiz(quizId),

  /**
   * Toggle Publish/Draft / Visibility Quiz Status
   * POST /custom_admin/quizzes/{quizId}/toggle-visibility/
   */
  toggleVisibility: (quizId, isVisible) => customAdminService.toggleVisibility(quizId, isVisible),
  toggleQuizStatus: (quizId, isPublished) => customAdminService.toggleVisibility(quizId, isPublished),

  /**
   * Penalty Audit Logs
   * GET /custom_admin/penalties/
   */
  getPenalties: async (params = {}) => {
    const response = await adminApi.get("custom_admin/penalties/", { params });
    return response.data;
  },

  /**
   * Support Inbox
   * GET /custom_admin/support/
   */
  getSupportTickets: async (params = {}) => {
    const response = await adminApi.get("custom_admin/support/", { params });
    return response.data;
  },

  /**
   * Update Support Ticket Status (Pending / Resolved)
   * PATCH /custom_admin/support/{ticketId}/
   */
  updateSupportTicket: async (ticketId, status) => {
    const response = await adminApi.patch(`custom_admin/support/${ticketId}/`, { status });
    return response.data;
  },

  /**
   * Feedback Management Delegates
   */
  getAdminFeedbacks: (params) => adminFeedbackService.getFeedbacks(params),
  getFeedbackStats: () => adminFeedbackService.getStats(),
  getFeedbackDetails: (id) => adminFeedbackService.getFeedback(id),
  replyAdminFeedback: (id, replyText) => adminFeedbackService.replyFeedback(id, { reply_message: replyText }),
  updateAdminFeedback: (id, payload) => adminFeedbackService.updateFeedback(id, payload),
  toggleHideAdminFeedback: (id) => adminFeedbackService.hideFeedback(id),
  deleteAdminFeedback: (id) => adminFeedbackService.deleteFeedback(id),
};

export default adminService;
