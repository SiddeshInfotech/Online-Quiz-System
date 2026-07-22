import axios from "axios";

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
        // Try fallback auth endpoints if 404
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
  getQuizzes: async (params = {}) => {
    const response = await adminApi.get("custom_admin/quizzes/", { params });
    return response.data;
  },

  /**
   * Create Quiz
   * POST /custom_admin/quizzes/
   */
  createQuiz: async (payload) => {
    const response = await adminApi.post("custom_admin/quizzes/", payload);
    return response.data;
  },

  /**
   * Update Quiz
   * PUT /custom_admin/quizzes/{quizId}/
   */
  updateQuiz: async (quizId, payload) => {
    const response = await adminApi.put(`custom_admin/quizzes/${quizId}/`, payload);
    return response.data;
  },

  /**
   * Archive Quiz (Backend deletion operation)
   * DELETE /custom_admin/quizzes/{quizId}/
   */
  archiveQuiz: async (quizId) => {
    const response = await adminApi.delete(`custom_admin/quizzes/${quizId}/`);
    return response.data;
  },

  /**
   * Toggle Publish/Draft Quiz Status
   * PATCH /custom_admin/quizzes/{quizId}/
   */
  toggleQuizStatus: async (quizId, isPublished) => {
    const response = await adminApi.patch(`custom_admin/quizzes/${quizId}/`, {
      is_published: isPublished,
    });
    return response.data;
  },

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
};

export default adminService;
