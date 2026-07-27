import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getToken, clearAuth } from "../utils/auth";
import authService from "../services/authService";

/**
 * Login & Landing Guard
 * ------------------------------------------------------------------
 * Situation 1: Opening Landing Page ("/") -> Always show Landing Page.
 * No automatic page-load redirect to /dashboard.
 *
 * Situation 2: Visiting auth modal paths directly in URL -> Validate
 * token if present; if valid redirect to /dashboard, if invalid clear storage.
 */
const useAuthGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  useEffect(() => {
    const runGuard = async () => {
      // 🟢 Situation 1: Opening Landing Page "/" -> ALWAYS show Landing Page. No automatic page-load redirect.
      if (location.pathname === "/") {
        setIsCheckingAuth(false);
        return;
      }

      // If user navigates directly to /login or other auth paths via URL
      if (location.pathname === "/login") {
        const accessToken = localStorage.getItem("access_token") || getToken();

        if (!accessToken) {
          setIsCheckingAuth(false);
          return;
        }

        try {
          await authService.verifyToken(accessToken);
          navigate("/dashboard", { replace: true });
        } catch {
          clearAuth();
          setIsCheckingAuth(false);
        } finally {
          setIsCheckingAuth(false);
        }
      } else {
        setIsCheckingAuth(false);
      }
    };

    runGuard();
  }, [location.pathname, navigate]);

  return { isCheckingAuth };
};

export default useAuthGuard;
