import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

/**
 * Route Guard for Admin Panel.
 * Checks that adminToken exists and user has is_staff == true.
 * Redirects unauthorized users strictly to /admin (Admin Login).
 * Never redirects to student login.
 */
const AdminProtectedRoute = () => {
  const { adminToken, isStaff } = useAdminAuth();

  if (!adminToken || !isStaff) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
