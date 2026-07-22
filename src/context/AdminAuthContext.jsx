import { createContext, useContext, useState, useEffect, useCallback } from "react";
import adminService from "../services/adminService";

export const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem("admin_token") || null;
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setAdminToken(null);
    setAdminUser(null);
  }, []);

  // Handle 401 unauthorized automatic logout
  useEffect(() => {
    const handleAutoLogout = () => {
      logout();
    };
    window.addEventListener("admin_auth:logout", handleAutoLogout);
    return () => window.removeEventListener("admin_auth:logout", handleAutoLogout);
  }, [logout]);

  const login = async (credentials) => {
    const data = await adminService.adminLogin(credentials);

    // Extract token from response payload formats
    const token =
      data?.access_token ||
      data?.access ||
      data?.token ||
      data?.tokens?.access;

    // Extract user object
    const user = data?.user || data?.admin || data;

    // Check staff permissions
    const isStaff =
      user?.is_staff === true ||
      user?.is_superuser === true ||
      user?.role === "admin" ||
      user?.is_admin === true;

    if (!isStaff && !token) {
      throw new Error("Invalid admin credentials.");
    }

    if (user && !isStaff) {
      throw new Error("Access Denied: You must have staff or admin permissions to log into the Admin Panel.");
    }

    if (!token) {
      throw new Error("Authentication response did not include a valid token.");
    }

    // Save strictly under admin_token and admin_user keys
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_user", JSON.stringify(user));

    setAdminToken(token);
    setAdminUser(user);

    return { token, user };
  };

  const isStaff = Boolean(
    adminUser?.is_staff === true ||
    adminUser?.is_superuser === true ||
    adminUser?.role === "admin" ||
    adminUser?.is_admin === true
  );

  return (
    <AdminAuthContext.Provider
      value={{
        adminToken,
        adminUser,
        isStaff,
        login,
        logout,
        isAuthenticated: Boolean(adminToken && isStaff),
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

export default AdminAuthContext;
