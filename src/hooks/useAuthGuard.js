import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getToken } from "../utils/auth";
import authService from "../services/authService";

/**
 * Login & Landing Guard
 * ------------------------------------------------------------------
 * When a user visits "/" or "/login" (and related auth paths), check
 * localStorage for an existing access_token.  If one is found, call
 * POST /api/token/verify/ to confirm it is still valid.
 *
 * - Valid token  → redirect to /dashboard automatically.
 * - Invalid token → the silent auto-refresh interceptor in api.js
 *   will attempt a refresh transparently. If that also fails the
 *   interceptor clears auth state; we simply leave the user on the
 *   landing / login page.
 *
 * Returns { isCheckingAuth } so consuming components can defer
 * rendering auth-related UI until the guard is resolved.
 */
const AUTH_PATHS = ["/", "/login", "/signup", "/forgot-password", "/verify-otp", "/verify-email", "/reset-password", "/password-reset-success"];

const useAuthGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const runGuard = async () => {
      const isAuthPath = AUTH_PATHS.some(
        (p) => location.pathname === p || location.pathname.startsWith(p + "?")
      );

      if (!isAuthPath) {
        setIsCheckingAuth(false);
        return;
      }

      const accessToken = getToken();

      if (!accessToken) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        // POST /api/token/verify/ – will 401 if expired; the Axios
        // interceptor silently refreshes and retries automatically.
        await authService.verifyToken(accessToken);
        // Token is valid (or was silently refreshed) → redirect.
        navigate("/dashboard", { replace: true });
      } catch {
        // Both verify and silent refresh failed; stay on landing page.
        setIsCheckingAuth(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    runGuard();
  }, [location.pathname, navigate]);

  return { isCheckingAuth };
};

export default useAuthGuard;
