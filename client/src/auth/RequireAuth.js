import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 1. Wait for AuthContext to finish checking the session
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'sans-serif' 
      }}>
        <p>Loading application...</p>
      </div>
    );
  }

  // 2. If no user is logged in, redirect to Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. UPDATED: If User exists but Profile is still loading/missing
  // We show a clean sync message instead of the red debug error.
  if (!profile) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        color: '#666'
      }}>
        <p>Synchronizing your profile...</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            marginTop: '10px', 
            padding: '8px 16px', 
            cursor: 'pointer',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#fff'
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // 4. Profile is loaded, safe to render the protected content
  return children;
}