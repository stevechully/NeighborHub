import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div style={{
      padding: 16,
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <strong style={{ fontSize: 18 }}>Resident Portal</strong>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span style={{ fontSize: 14 }}>
          {profile?.full_name || "User"}
        </span>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
