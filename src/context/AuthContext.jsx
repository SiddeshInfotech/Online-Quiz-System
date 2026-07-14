import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { getToken, setToken, removeToken, getCurrentUser, setUser, removeUser } from "../utils/auth";
import authService from "../services/authService";
import { resolveMediaUrl } from "../services/api";

/** Normalise a raw user object from the backend so profile_picture is always an absolute URL.
 *  - Cloudinary URLs (https://res.cloudinary.com/...) are already absolute and pass through.
 *  - Relative paths like /media/... get the backend origin prepended.
 *  - Null/empty values stay null so callers fall back to initials.
 */
const normaliseUser = (raw) => {
  if (!raw) return null;
  return {
    ...raw,
    profile_picture: resolveMediaUrl(raw.profile_picture) || null,
  };
};


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile from backend and update user state
  const fetchProfile = useCallback(async () => {
    try {
      const profileData = await authService.getProfile();
      console.log("GET /api/auth/profile/ response profile_picture:", profileData.profile_picture || profileData.user?.profile_picture);
      // Backend may return { user: {...} } or the user object directly
      const userData = normaliseUser(profileData.user || profileData);
      setUser(userData);
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      // If profile fetch fails (e.g. expired token), clear auth state
      console.error("Failed to fetch profile:", err);
      removeToken();
      removeUser();
      setTokenState(null);
      setCurrentUser(null);
      return null;
    }
  }, []);

  // Load from localStorage on startup + validate token by fetching profile
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      const storedUser = getCurrentUser();

      if (storedToken) {
        setTokenState(storedToken);
        // Use stored user immediately for fast render
        if (storedUser) {
          setCurrentUser(normaliseUser(storedUser));
        }
        // Then fetch fresh profile in background to validate token
        await fetchProfile();
      }

      setIsLoading(false);
    };

    initAuth();
  }, [fetchProfile]);

  const login = useCallback((newToken, user) => {
    setToken(newToken);
    const normalised = normaliseUser(user);
    if (normalised) setUser(normalised);

    setTokenState(newToken);
    setCurrentUser(normalised || null);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    removeUser();
    setTokenState(null);
    setCurrentUser(null);
    window.location.href = "/login";
  }, []);

  const updateUser = useCallback((userData) => {
    const normalised = normaliseUser(userData);
    setUser(normalised);
    setCurrentUser(normalised);
  }, []);

  const isAuthenticated = useMemo(() => !!token, [token]);

  // Listen for 401 events dispatched from api.js to trigger centralized logout
  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, [logout]);

  const value = useMemo(
    () => ({
      currentUser,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
      updateUser,
      fetchProfile,
    }),
    [currentUser, token, isAuthenticated, isLoading, login, logout, updateUser, fetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

