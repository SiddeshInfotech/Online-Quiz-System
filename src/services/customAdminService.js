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
};

export default customAdminService;
