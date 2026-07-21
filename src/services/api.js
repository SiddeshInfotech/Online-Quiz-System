import axios from "axios";
import { getToken } from "../utils/auth";

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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://online-quiz-system-9vlk.onrender.com/api/",
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

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    return Promise.reject(error);
  }
);

export default api;