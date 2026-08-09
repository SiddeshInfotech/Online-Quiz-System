import { createContext, useContext, useMemo } from "react";
import useDashboard from "../hooks/useDashboard";
import { AuthContext } from "./AuthContext";
const DashboardContext = createContext(null);
export const DashboardProvider = ({ children }) => {
  const dashboard = useDashboard();
  const { currentUser } = useContext(AuthContext);

  const value = useMemo(() => {
    if (!dashboard.data) return dashboard;

    const authUser = currentUser || {};
    const resolvedPicture = authUser.profile_picture || dashboard.data.user?.profile_picture || null;

    const profileCompletion = Number(
      authUser.profile_completion ?? dashboard.data.user?.profile_completion ?? 100
    );

    const missingFields = Array.isArray(authUser.missing_fields)
      ? authUser.missing_fields
      : Array.isArray(dashboard.data.user?.missing_fields)
      ? dashboard.data.user.missing_fields
      : [];

    const mergedUser = {
      ...dashboard.data.user,
      full_name: authUser.full_name ?? dashboard.data.user.full_name ?? dashboard.data.user.name,
      username: authUser.username ?? dashboard.data.user.username,
      email: authUser.email ?? dashboard.data.user.email,
      role: authUser.role ?? dashboard.data.user.role,
      profile_picture: resolvedPicture,
      avatar: resolvedPicture,
      profile_completion: profileCompletion,
      missing_fields: missingFields,
    };

    if (!mergedUser.profile_picture || mergedUser.profile_picture.includes("ui-avatars")) {
      const displayName = mergedUser.full_name || mergedUser.username || "User";
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6D5EF9&color=fff`;
      mergedUser.profile_picture = fallbackUrl;
      mergedUser.avatar = fallbackUrl;
    }

    let notifications = [...(dashboard.data.notifications || [])];
    notifications = notifications.filter((n) => n.id !== "profile_completion_reminder");

    if (profileCompletion < 100) {
      const formatFieldName = (field) =>
        String(field)
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

      const formattedMissing = missingFields.map(formatFieldName).join(", ");

      notifications.unshift({
        id: "profile_completion_reminder",
        text: `Profile Completion: ${profileCompletion}%\nMissing: ${formattedMissing || "Profile information"}`,
        title: "Profile Completion Reminder",
        time: "Pinned",
        isRead: false,
        iconType: "target",
        actionUrl: "/profile",
      });
    }

    return {
      ...dashboard,
      refetch: dashboard.refetch,
      setData: dashboard.setData,
      data: {
        ...dashboard.data,
        user: mergedUser,
        notifications,
      },
    };
  }, [dashboard, currentUser]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider.");
  }
  return context;
};

export default DashboardContext;

