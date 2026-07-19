/**
 * DashboardContext.jsx
 *
 * Provides all dashboard data to the component tree.
 * Components consume useDashboardContext() instead of
 * importing mock data or calling services directly.
 *
 * Usage:
 *   const { data, loading, error } = useDashboardContext();
 */

import { createContext, useContext, useMemo } from "react";
import useDashboard from "../hooks/useDashboard";
import { AuthContext } from "./AuthContext";

const DashboardContext = createContext(null);

/**
 * Wraps the dashboard layout tree and makes data available
 * to every nested component via context.
 */
export const DashboardProvider = ({ children }) => {
  const dashboard = useDashboard();
  const { currentUser } = useContext(AuthContext);

  const value = useMemo(() => {
    if (!dashboard.data) return dashboard;

    // authUser.profile_picture always wins — it's normalised (Cloudinary absolute URL or null).
    // dashboard.data.user.profile_picture is the stale API response and is a lower-priority fallback.
    const authUser = currentUser || {};
    const resolvedPicture = authUser.profile_picture || dashboard.data.user?.profile_picture || null;

    const mergedUser = {
      ...dashboard.data.user,
      full_name: authUser.full_name ?? dashboard.data.user.full_name ?? dashboard.data.user.name,
      username: authUser.username ?? dashboard.data.user.username,
      email: authUser.email ?? dashboard.data.user.email,
      role: authUser.role ?? dashboard.data.user.role,
      profile_picture: resolvedPicture,
      avatar: resolvedPicture,
    };

    // Only apply ui-avatars fallback when there is genuinely no real image URL.
    if (!mergedUser.profile_picture || mergedUser.profile_picture.includes("ui-avatars")) {
      const displayName = mergedUser.full_name || mergedUser.username || "User";
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6D5EF9&color=fff`;
      mergedUser.profile_picture = fallbackUrl;
      mergedUser.avatar = fallbackUrl;
    }

    return {
      ...dashboard,
      refetch: dashboard.refetch,
      setData: dashboard.setData,
      data: {
        ...dashboard.data,
        user: mergedUser,
      },
    };
  }, [dashboard, currentUser]);

  console.log("[TRACE] 9. DashboardContext rendering with data.user:", value.data?.user);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

/**
 * Hook for consuming dashboard context inside any component.
 * Throws a clear error if used outside the provider.
 */
export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider.");
  }
  return context;
};

export default DashboardContext;

