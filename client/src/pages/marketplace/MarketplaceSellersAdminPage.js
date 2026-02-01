import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { fetchAllSellers, approveSeller } from "../../api/marketplaceSellers.api";

export default function MarketplaceSellersAdminPage() {
  const { profile, loading: authLoading } = useAuth();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSellers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllSellers();
      setSellers(data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && profile && isAdmin) {
      loadSellers();
    }
  }, [authLoading, profile, isAdmin, loadSellers]);

  async function handleApproveSeller(id) {
    if (!window.confirm("Approve this seller?")) return;

    try {
      await approveSeller(id);
      alert("Seller approved ✅");
      await loadSellers();
    } catch (err) {
      alert(err.message);
    }
  }

  if (authLoading || !profile) {
    return <div style={{ padding: 40 }}>Verifying session...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 40 }}>
        <h3>Access Denied</h3>
        <p>This page is only for Admin.</p>
      </div>
    );
  }

  const pending = sellers.filter((s) => s.is_approved === false);
  const approved = sellers.filter((s) => s.is_approved === true);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Seller Requests (Admin)</h2>
        <button onClick={loadSellers}>Refresh</button>
      </div>

      <div style={cardStyle}>
        <h3>Pending Sellers</h3>

        {loading ? (
          <p>Loading...</p>
        ) : pending.length === 0 ? (
          <p>No pending sellers.</p>
        ) : (
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f3f3" }}>
                <th align="left">Name</th>
                <th align="left">Email</th>
                <th align="left">Status</th>
                <th align="left">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((s) => (
                <tr key={s.seller_id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{s.profiles?.full_name || "-"}</td>
                  <td>{s.profiles?.email || "-"}</td>
                  <td>
                    <b style={{ color: "orange" }}>PENDING</b>
                  </td>
                  <td>
                    <button
                      onClick={() => handleApproveSeller(s.seller_id)}
                      style={{
                        padding: "6px 10px",
                        background: "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={cardStyle}>
        <h3>Approved Sellers</h3>

        {loading ? (
          <p>Loading...</p>
        ) : approved.length === 0 ? (
          <p>No approved sellers yet.</p>
        ) : (
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f3f3" }}>
                <th align="left">Name</th>
                <th align="left">Email</th>
                <th align="left">Status</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((s) => (
                <tr key={s.seller_id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{s.profiles?.full_name || "-"}</td>
                  <td>{s.profiles?.email || "-"}</td>
                  <td>
                    <b style={{ color: "green" }}>APPROVED</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  marginBottom: 20,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};
