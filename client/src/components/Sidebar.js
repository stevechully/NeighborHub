import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const location = useLocation();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";
  const isResident = roleName === "RESIDENT";
  const isWorker = roleName === "WORKER";
  const isSecurity = roleName === "SECURITY";

  // Sidebar Links by role
  const links = [];

  links.push({ label: "Dashboard", to: "/dashboard", icon: "🏠" });

  if (isResident) {
    links.push(
      { label: "Complaints", to: "/complaints", icon: "📌" },
      { label: "Worker Services", to: "/worker-services", icon: "🧑‍🔧" },
      { label: "Notices", to: "/notices", icon: "📢" },
      { label: "Events", to: "/events", icon: "🎉" },
      { label: "Facilities", to: "/facilities", icon: "🏟️" },
      { label: "Maintenance", to: "/maintenance", icon: "🧾" },
      { label: "My Visitors & Parcels", to: "/my-parcels", icon: "📦" },
      { label: "Marketplace", to: "/marketplace", icon: "🛒" }
    );
  }

  if (isWorker) {
    links.push(
      { label: "Complaints", to: "/complaints", icon: "📌" },
      { label: "Worker Services", to: "/worker-services", icon: "🧑‍🔧" },
      { label: "Marketplace", to: "/marketplace", icon: "🛒" }
    );
  }

  if (isSecurity) {
    links.push(
      { label: "Gate Management", to: "/gate", icon: "🚪" },
      { label: "Marketplace", to: "/marketplace", icon: "🛒" }
    );
  }

  if (isAdmin) {
    links.push(
      { label: "Complaints", to: "/complaints", icon: "📌" },
      { label: "Worker Services", to: "/worker-services", icon: "🧑‍🔧" },
      { label: "Notices", to: "/notices", icon: "📢" },
      { label: "Events", to: "/events", icon: "🎉" },
      { label: "Facilities", to: "/facilities", icon: "🏟️" },
      { label: "Maintenance", to: "/maintenance", icon: "🧾" },
      { label: "Gate Management", to: "/gate", icon: "🚪" },
      { label: "Marketplace", to: "/marketplace", icon: "🛒" },
      { label: "Approve Sellers", to: "/marketplace/sellers", icon: "✅", highlight: true }
    );
  }

  return (
    <div style={styles.sidebar}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandLogo}>🏢</div>
        <div>
          <div style={styles.brandTitle}>Resident Portal</div>
          <div style={styles.brandSub}>Smart Community</div>
        </div>
      </div>

      {/* Links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
              <span style={{ width: 22 }}>{item.icon}</span>
              <span style={{ fontWeight: 700 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.roleBox}>
          <div style={{ fontSize: 12, color: "#666" }}>Logged in as</div>
          <div style={{ fontWeight: 800 }}>{roleName || "User"}</div>
        </div>

        <button onClick={logout} style={styles.logoutBtn}>
          🚪 Logout
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
    borderRight: "1px solid #eee",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  brand: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #eef2f7",
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "#2563eb",
    color: "#fff",
    fontSize: 18,
  },
  brandTitle: {
    fontWeight: 900,
    fontSize: 15,
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: 12,
    color: "#666",
  },
  link: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 12,
    textDecoration: "none",
    color: "#111",
    border: "1px solid transparent",
    transition: "0.2s",
  },
  activeLink: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
  },
  highlightLink: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingTop: 12,
    borderTop: "1px solid #eee",
  },
  roleBox: {
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #eef2f7",
  },
  logoutBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};
