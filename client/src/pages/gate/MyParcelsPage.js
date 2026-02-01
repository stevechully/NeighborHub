import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { fetchVisitors, fetchParcels } from "../../api/visitorParcel.api";
import useParcelNotifications from "../../hooks/useParcelNotifications"; 

export default function MyParcelsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = profile?.id; 
  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isResident = roleName === "RESIDENT";
  console.log("🟢 MyParcelsPage Mounted");
  console.log("🟢 userId for realtime:", userId)

  // ✅ FIXED: Individual fetches with safe .catch() handlers
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Attempt to fetch visitors safely
      const vData = await fetchVisitors().catch((err) => {
        console.log("❌ Visitors fetch failed (likely RLS):", err.message);
        return []; // Return empty array on fail
      });

      // Attempt to fetch parcels safely
      const pData = await fetchParcels().catch((err) => {
        console.log("❌ Parcels fetch failed:", err.message);
        return [];
      });

      setVisitors(vData || []);
      setParcels(pData || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const onNewParcel = useCallback((parcel) => {
    alert(`📦 New parcel received from ${parcel.courier_name}!`);
    loadData(); 
  }, [loadData]);

  useParcelNotifications(userId, onNewParcel);

  useEffect(() => {
    if (!authLoading && profile) loadData();
  }, [authLoading, profile, loadData]);

  if (authLoading || !profile) {
    return <div style={{ padding: 40 }}>Verifying session...</div>;
  }

  if (!isResident) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3>🚫 Access Denied</h3>
        <p>This page is for residents only.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>My Parcels & Visitors</h2>
      
      {/* VISITORS SECTION */}
      <div style={cardStyle}>
        <h3>My Visitors</h3>
        {loading ? <p>Loading...</p> : visitors.length === 0 ? (
          <p>No visitors found.</p>
        ) : (
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
                <th>Name</th><th>Purpose</th><th>Entry</th><th>Exit</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map(v => (
                <tr key={v.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{v.visitor_name}</td>
                  <td>{v.purpose}</td>
                  <td>{new Date(v.entry_time).toLocaleString()}</td>
                  <td>{v.exit_time ? new Date(v.exit_time).toLocaleString() : "Inside"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PARCELS SECTION */}
      <div style={cardStyle}>
        <h3>My Parcels</h3>
        {loading ? <p>Loading...</p> : parcels.length === 0 ? (
          <p>No parcels found.</p>
        ) : (
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
                <th>Courier</th><th>Status</th><th>Received At</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{p.courier_name} {p.tracking_number && `(${p.tracking_number})`}</td>
                  <td><strong>{p.status}</strong></td>
                  <td>{new Date(p.received_at).toLocaleString()}</td>
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
  padding: 20,
  borderRadius: 8,
  marginBottom: 20,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};