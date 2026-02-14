import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";
  const isResident = roleName === "RESIDENT";
  const isWorker = roleName === "WORKER";
  const isSecurity = roleName === "SECURITY";

  // Sidebar Links by role
  const links = [];

  links.push({ label: "Dashboard", to: "/dashboard" });

  if (isResident) {
    links.push(
      { label: "Complaints", to: "/complaints" },
      { label: "Worker Services", to: "/worker-services" },
      { label: "Notices", to: "/notices" },
      { label: "Events", to: "/events" },
      { label: "Facilities", to: "/facilities" },
      { label: "Maintenance", to: "/maintenance" },
      { label: "My Visitors & Parcels", to: "/my-parcels" },
      { label: "Marketplace", to: "/marketplace" }
    );
  }

  if (isWorker) {
    links.push(
      { label: "Complaints", to: "/complaints" },
      { label: "Worker Services", to: "/worker-services" },
      { label: "Marketplace", to: "/marketplace" }
    );
  }

  if (isSecurity) {
    links.push(
      { label: "Gate Management", to: "/gate" },
      { label: "Marketplace", to: "/marketplace" }
    );
  }

  if (isAdmin) {
    links.push(
      { label: "Complaints", to: "/complaints" },
      { label: "Worker Services", to: "/worker-services" },
      { label: "Notices", to: "/notices" },
      { label: "Events", to: "/events" },
      { label: "Facilities", to: "/facilities" },
      { label: "Maintenance", to: "/maintenance" },
      { label: "Gate Management", to: "/gate" },
      { label: "Marketplace", to: "/marketplace" },
      { label: "Approve Sellers", to: "/marketplace/sellers", highlight: true }
    );
  }

  // Unified logout handler with navigation
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={styles.sidebar}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandLogo}>RP</div>
        <div>
          <div style={styles.brandTitle}>Resident Portal</div>
          <div style={styles.brandSub}>Smart Community</div>
        </div>
      </div>

      {/* Links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {links.map((item) => {
          const active = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                ...styles.link,
                ...(active ? styles.activeLink : {}),
                ...(item.highlight ? styles.highlightLink : {}),
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.roleBox}>
          <div style={{ fontSize: 11, color: "#6b7280", textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</div>
          <div style={{ fontWeight: 700, color: "#111827" }}>{roleName || "User"}</div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 260,
    height: "100vh",
    background: "#fff",
    borderRight: "1px solid #e5e7eb",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  brand: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "0 8px 16px 8px",
    borderBottom: "1px solid #f3f4f6",
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    background: "#1e40af",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
  },
  brandTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: "#111827",
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: 12,
    color: "#6b7280",
  },
  link: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 8,
    textDecoration: "none",
    color: "#4b5563",
    transition: "0.2s all ease",
  },
  activeLink: {
    background: "#f3f4f6",
    color: "#1e40af",
  },
  highlightLink: {
    background: "#fff7ed",
    color: "#c2410c",
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingTop: 16,
    borderTop: "1px solid #f3f4f6",
  },
  roleBox: {
    padding: "10px 12px",
    borderRadius: 8,
    background: "#f9fafb",
  },
  logoutBtn: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "0.2s",
  },
};