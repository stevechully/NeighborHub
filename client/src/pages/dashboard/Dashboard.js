import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchComplaints } from "../../api/complaints.api";
import { useAuth } from "../../auth/AuthContext";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || "USER";

  useEffect(() => {
    async function test() {
      try {
        const data = await fetchComplaints();
        console.log("✅ Complaints fetched:", data);
      } catch (err) {
        console.error("❌ Complaints fetch failed:", err.message);
      }
    }
    test();
  }, []);

  return (
    <div style={{ padding: 10 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
          👋 Welcome, {profile?.full_name || "User"}
        </h2>
        <p style={{ margin: "6px 0 0", color: "#666" }}>
          Role: <b>{roleName}</b>
        </p>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 18,
          border: "1px solid #eee",
          boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>⚡ Quick Actions</h3>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={primaryBtn} onClick={() => navigate("/complaints")}>
            📌 Complaints
          </button>

          <button style={secondaryBtn} onClick={() => navigate("/maintenance")}>
            🧾 Maintenance
          </button>

          <button style={secondaryBtn} onClick={() => navigate("/my-parcels")}>
            📦 Parcels
          </button>

          <button style={secondaryBtn} onClick={() => navigate("/marketplace")}>
            🛒 Marketplace
          </button>

          <button style={secondaryBtn} onClick={() => navigate("/worker-services")}>
            🧑‍🔧 Worker Services
          </button>

          <button style={secondaryBtn} onClick={() => navigate("/facilities")}>
            🏟️ Facilities
          </button>

          <button style={secondaryBtn} onClick={() => navigate("/events")}>
            🎉 Events
          </button>

          <button style={secondaryBtn} onClick={() => navigate("/notices")}>
            📢 Notices
          </button>

          {/* Security/Admin only page */}
          {(roleName === "SECURITY" || roleName === "ADMIN") && (
            <button style={secondaryBtn} onClick={() => navigate("/gate")}>
              🚪 Gate Management
            </button>
          )}

          {/* Admin only page */}
          {roleName === "ADMIN" && (
            <button style={secondaryBtn} onClick={() => navigate("/marketplace/sellers")}>
              ✅ Approve Sellers
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111",
  fontWeight: 700,
  cursor: "pointer",
};
