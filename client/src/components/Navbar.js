import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { profile, logout } = useAuth();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || "USER";

  return (
    <div style={styles.navbar}>
      <div>
        <div style={styles.title}>Dashboard</div>
        <div style={styles.subtitle}>Manage your apartment activities</div>
      </div>

      <div style={styles.right}>
        <div style={styles.profileChip}>
          <div style={styles.avatar}>
            {(profile?.full_name?.[0] || "U").toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>
              {profile?.full_name || "User"}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>{roleName}</div>
          </div>
        </div>

        <button onClick={logout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    padding: "14px 18px",
    background: "#fff",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  profileChip: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #eef2f7",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: "#2563eb",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  },
  logoutBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #eee",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
};
