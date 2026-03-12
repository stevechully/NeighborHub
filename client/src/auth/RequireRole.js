import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireRole({ children, allowedRoles }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium animate-pulse">Checking permissions...</p>
      </div>
    );
  }

  // Determine user's role
  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || "RESIDENT";

  // If the user's role is not in the allowed list, kick them back to the dashboard
  if (!allowedRoles.includes(roleName)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If they are allowed, render the page
  return children;
}