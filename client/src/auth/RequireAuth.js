import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 1. Wait for AuthContext to finish
  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>Loading application...</div>;
  }

  // 2. If no user, go to Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. ✅ CRITICAL FIX: If User exists but Profile is missing, STOP HERE.
  // This prevents the "White Screen" crash in Navbar/Sidebar.
  if (!profile) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#d00" }}>
        <h2>⚠️ Profile Error</h2>
        <p>User is logged in, but we could not load your profile data.</p>
        <p><strong>Debug Info:</strong> User ID: {user.id}</p>
        <p>Possible causes: Internet issues, RLS Policies, or Database connection.</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ padding: "10px 20px", cursor: "pointer", marginTop: 20 }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // 4. Safe to render Dashboard
  return children;
}