import axios from "axios";
import { getToken, getRefreshToken, setToken, clearAuth } from "../utils/auth";

/**
 * The root of the backend server (no trailing slash).
 * Used to resolve relative media paths returned by the backend
 * (e.g. /media/profile_pictures/avatar.jpg → full URL).
 */
export const BACKEND_ORIGIN =
  (import.meta.env.VITE_API_URL || "https://online-quiz-system-9vlk.onrender.com/api/")
    .replace(/\/api\/?$/, "")   // strip trailing /api/
    .replace(/\/$/, "");        // strip any remaining trailing slash

/**
 * Resolve a profile-picture value returned by the backend.
 * - If it is already an absolute URL (http/https / blob), return as-is.
 * - If it is a relative path (starts with /), prepend BACKEND_ORIGIN.
 * - If falsy, return null so callers can fall back to initials.
 */
export const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//.test(url) || url.startsWith("blob:")) return url;
  if (url.startsWith("/")) return `${BACKEND_ORIGIN}${url}`;
  return `${BACKEND_ORIGIN}/${url}`;
};

const BASE_URL = import.meta.env.VITE_API_URL || "https://online-quiz-system-9vlk.onrender.com/api/";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 120 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach access_token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// State for queuing concurrent requests during silent refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Silent Auto-Refresh on 401 Unauthorized & 403 PREMIUM_REQUIRED
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 PREMIUM_REQUIRED
    if (
      error.response &&
      error.response.status === 403 &&
      error.response?.data?.code === "PREMIUM_REQUIRED"
    ) {
      window.dispatchEvent(
        new CustomEvent("subscription:premium-required", {
          detail: {
            message:
              error.response.data.detail ||
              error.response.data.message ||
              "Upgrade to QuizGen Pro to unlock this feature!",
            upgradeUrl: error.response.data.upgrade_url || "/pricing",
            featureKey: error.response.data.code || error.config?.url || "premium",
          },
        })
      );
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized with Silent Refresh
    if (error.response && error.response.status === 401 && originalRequest) {
      const requestUrl = originalRequest.url || "";
      const isAuthEndpoint =
        requestUrl.includes("/token/refresh/") ||
        requestUrl.includes("/token/verify/") ||
        requestUrl.includes("/auth/login/");

      if (isAuthEndpoint || originalRequest._retry) {
        clearAuth();
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        isRefreshing = false;
        clearAuth();
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(error);
      }

      try {
        const refreshEndpoint = BASE_URL.endsWith("/")
          ? `${BASE_URL}token/refresh/`
          : `${BASE_URL}/token/refresh/`;

        const res = await axios.post(refreshEndpoint, { refresh: refreshToken });

        const newAccessToken = res.data?.access || res.data?.access_token || res.data?.token;
        const newRefreshToken = res.data?.refresh || res.data?.refresh_token;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh endpoint.");
        }

        setToken(newAccessToken, newRefreshToken);

        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        clearAuth();
        window.dispatchEvent(new CustomEvent("auth:logout"));

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;