import axios from "axios";

/**
 * Dedicated Axios instance for Admin Feedback Management API.
 * Attaches admin Bearer token automatically.
 */
const BASE_URL = import.meta.env.VITE_API_URL || "https://online-quiz-system-9vlk.onrender.com/api/";

const adminApi = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Bearer token
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

/**
 * Helper to execute backend API requests with configurable primary and fallback endpoints.
 */
const requestWithFallback = async (method, path, data = null, config = {}) => {
  try {
    const response = await adminApi({
      method,
      url: `admin/feedback/${path}`,
      data,
      ...config,
    });
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await adminApi({
          method,
          url: `custom_admin/feedback/${path}`,
          data,
          ...config,
        });
        return fallbackRes.data;
      } catch (_) {}
    }
    throw err;
  }
};

const adminFeedbackService = {
  /**
   * GET /api/admin/feedback/stats/
   * Returns overall statistics: total_feedback, pending, reviewed, replied, hidden, average_rating, five_star_count, etc.
   */
  getStats: async () => {
    return await requestWithFallback("GET", "stats/");
  },

  /**
   * GET /api/admin/feedback/
   * Supports query params: page, search, rating, status, ordering
   */
  getFeedbacks: async (params = {}) => {
    // Clean params to remove empty values
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "" && params[key] !== "All") {
        cleanParams[key] = params[key];
      }
    });
    return await requestWithFallback("GET", "", null, { params: cleanParams });
  },

  /**
   * GET /api/admin/feedback/{id}/
   * Returns full feedback details
   */
  getFeedback: async (id) => {
    return await requestWithFallback("GET", `${id}/`);
  },

  /**
   * POST /api/admin/feedback/{id}/reply/
   * Body: { "reply_message": "...text..." }
   */
  replyFeedback: async (id, data) => {
    return await requestWithFallback("POST", `${id}/reply/`, data);
  },

  /**
   * PATCH /api/admin/feedback/{id}/
   * Sends modified fields only (e.g. status, rating, message)
   */
  updateFeedback: async (id, data) => {
    return await requestWithFallback("PATCH", `${id}/`, data);
  },

  /**
   * POST /api/admin/feedback/{id}/hide/
   * Toggle hide status
   */
  hideFeedback: async (id) => {
    return await requestWithFallback("POST", `${id}/hide/`);
  },

  /**
   * DELETE /api/admin/feedback/{id}/
   */
  deleteFeedback: async (id) => {
    return await requestWithFallback("DELETE", `${id}/`);
  },
};

export default adminFeedbackService;
