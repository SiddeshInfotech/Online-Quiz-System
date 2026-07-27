import axios from "axios";

/**
 * Dedicated service for Custom Admin Quiz operations.
 * Handles authentication headers, standard endpoints, and fallbacks.
 */
const BASE_URL = import.meta.env.VITE_API_URL || "https://online-quiz-system-9vlk.onrender.com/api/";

const adminApi = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach admin_token (or token)
adminApi.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new CustomEvent("admin_auth:logout"));
    }
    return Promise.reject(error);
  }
);

const customAdminService = {
  /**
   * Fetch all quizzes
   * GET /api/custom_admin/quizzes/
   */
  getQuizzes: async (params = {}) => {
    try {
      const response = await adminApi.get("custom_admin/quizzes/", { params });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await adminApi.get("quizzes/", { params });
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Create Quiz
   * POST /api/custom_admin/quizzes/ or POST /api/custom_admin/quizzes/create/
   */
  createQuiz: async (data) => {
    try {
      const response = await adminApi.post("custom_admin/quizzes/", data);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const response = await adminApi.post("custom_admin/quizzes/create/", data);
        return response.data;
      }
      throw err;
    }
  },

  /**
   * Edit Quiz
   * PUT /api/custom_admin/quizzes/{id}/ or PATCH /api/custom_admin/quizzes/{id}/
   */
  updateQuiz: async (id, data) => {
    try {
      const response = await adminApi.put(`custom_admin/quizzes/${id}/`, data);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        const response = await adminApi.patch(`custom_admin/quizzes/${id}/`, data);
        return response.data;
      }
      throw err;
    }
  },

  /**
   * Delete Quiz
   * DELETE /api/custom_admin/quizzes/{id}/ or DELETE /api/custom_admin/quizzes/{id}/delete/
   */
  deleteQuiz: async (id) => {
    try {
      const response = await adminApi.delete(`custom_admin/quizzes/${id}/`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        const response = await adminApi.delete(`custom_admin/quizzes/${id}/delete/`);
        return response.data;
      }
      throw err;
    }
  },

  /**
   * Toggle Visibility
   * POST /api/custom_admin/quizzes/{id}/toggle-visibility/ or PATCH fallback
   */
  toggleVisibility: async (id, isVisible) => {
    try {
      const response = await adminApi.post(`custom_admin/quizzes/${id}/toggle-visibility/`, {
        is_published: isVisible,
        is_visible: isVisible,
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        const response = await adminApi.patch(`custom_admin/quizzes/${id}/`, {
          is_published: isVisible,
          is_visible: isVisible,
        });
        return response.data;
      }
      throw err;
    }
  },

  /**
   * Fetch subscription stats overview
   * GET /api/custom_admin/subscriptions/stats/
   */
  getSubscriptionStats: async () => {
    try {
      const response = await adminApi.get("custom_admin/subscriptions/stats/");
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await adminApi.get("admin/subscriptions/stats/");
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Fetch user subscription table
   * GET /api/custom_admin/subscriptions/
   */
  getSubscriptions: async (params = {}) => {
    try {
      const response = await adminApi.get("custom_admin/subscriptions/", { params });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await adminApi.get("admin/subscriptions/", { params });
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Perform subscription action on user
   * POST /api/custom_admin/subscriptions/<user_id>/action/
   * @param {string|number} userId
   * @param {string} action - "UPGRADE" | "DOWNGRADE" | "EXTEND_30_DAYS" | "CANCEL" | "REACTIVATE"
   */
  subscriptionAction: async (userId, action) => {
    try {
      const response = await adminApi.post(`custom_admin/subscriptions/${userId}/action/`, {
        action,
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await adminApi.post(`admin/subscriptions/${userId}/action/`, {
          action,
        });
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Get full subscription detail for a specific user (admin read-only view)
   * Returns: current plan, status, start date, renewal date, days_remaining,
   *          daily_quiz_used, daily_quiz_limit, coding_question_used, coding_question_limit
   *
   * GET /api/custom_admin/subscriptions/<userId>/detail/
   * @param {string|number} userId
   */
  getUserSubscriptionDetail: async (userId) => {
    try {
      const response = await adminApi.get(`custom_admin/subscriptions/${userId}/detail/`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await adminApi.get(`admin/subscriptions/${userId}/detail/`);
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Get usage metrics for a specific user (today's quiz + coding question usage)
   * Returns: daily_quiz_used, daily_quiz_limit, coding_question_used, coding_question_limit, reset_at
   *
   * GET /api/custom_admin/subscriptions/<userId>/usage/
   * @param {string|number} userId
   */
  getUserUsageMetrics: async (userId) => {
    try {
      const response = await adminApi.get(`custom_admin/subscriptions/${userId}/usage/`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await adminApi.get(`admin/subscriptions/${userId}/usage/`);
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Get upgrade history for a specific user
   * Returns array of: { upgraded_at, plan, billing_cycle, renewal_date }
   *
   * GET /api/custom_admin/subscriptions/<userId>/upgrade-history/
   * @param {string|number} userId
   */
  getUserUpgradeHistory: async (userId) => {
    try {
      const response = await adminApi.get(`custom_admin/subscriptions/${userId}/upgrade-history/`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await adminApi.get(`admin/subscriptions/${userId}/upgrade-history/`);
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Get cancellation history for a specific user
   * Returns array of: { cancelled_at, reason, effective_date, reverted_to }
   *
   * GET /api/custom_admin/subscriptions/<userId>/cancellation-history/
   * @param {string|number} userId
   */
  getUserCancellationHistory: async (userId) => {
    try {
      const response = await adminApi.get(`custom_admin/subscriptions/${userId}/cancellation-history/`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await adminApi.get(`admin/subscriptions/${userId}/cancellation-history/`);
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Admin Panel AI Quiz Generator (Official System Quizzes)
   * POST /api/custom_admin/ai/generate-quiz/
   * @param {Object} quizPayload
   */
  generateAdminQuiz: async (quizPayload) => {
    const adminToken =
      localStorage.getItem("admin_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    const response = await adminApi.post("custom_admin/ai/generate-quiz/", quizPayload, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "X-Admin-Request": "true",
      },
    });
    return response.data;
  },
};

export default customAdminService;

