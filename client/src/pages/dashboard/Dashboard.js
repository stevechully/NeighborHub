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
        await fetchComplaints();
      } catch (err) {
        console.error("Complaints fetch failed:", err.message);
      }
    }
    test();
  }, []);

  return (
    <div style={{ padding: 40, maxWidth: 1200, margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 6
        }}>
          Welcome back, {profile?.full_name || "User"}
        </h1>

        <p style={{
          color: "#6b7280",
          fontSize: 14
        }}>
          {roleName} Dashboard
        </p>
      </div>

      {/* Quick Access Section */}
      <div>
        <h2 style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 20,
          color: "#374151"
        }}>
          Quick Access
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
        }}>
          <DashboardCard title="Complaints" onClick={() => navigate("/complaints")} />
          <DashboardCard title="Maintenance" onClick={() => navigate("/maintenance")} />
          <DashboardCard title="Parcels" onClick={() => navigate("/my-parcels")} />
          <DashboardCard title="Marketplace" onClick={() => navigate("/marketplace")} />
          <DashboardCard title="Worker Services" onClick={() => navigate("/worker-services")} />
          <DashboardCard title="Facilities" onClick={() => navigate("/facilities")} />
          <DashboardCard title="Events" onClick={() => navigate("/events")} />
          <DashboardCard title="Notices" onClick={() => navigate("/notices")} />

          {(roleName === "SECURITY" || roleName === "ADMIN") && (
            <DashboardCard title="Gate Management" onClick={() => navigate("/gate")} />
          )}

          {roleName === "ADMIN" && (
            <DashboardCard
              title="Seller Approvals"
              onClick={() => navigate("/marketplace/sellers")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* Clean Modern Card */
function DashboardCard({ title, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#ffffff",
        padding: "22px 20px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        cursor: "pointer",
        transition: "all 0.15s ease",
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        fontWeight: 500,
        fontSize: 15,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
      }}
    >
      {title}
    </div>
  );
}
