import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { 
  fetchVisitors, createVisitor, markVisitorExit, 
  fetchParcels, createParcel, markParcelPickedUp 
} from "../../api/visitorParcel.api";
import { fetchResidents } from "../../api/admin.api"; 

export default function GateManagementPage() {
  const { profile, loading: authLoading } = useAuth();
  
  const [visitors, setVisitors] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState([]);

  const [vName, setVName] = useState("");
  const [vPurpose, setVPurpose] = useState("");
  const [vResId, setVResId] = useState(""); 
  
  const [pCourier, setPCourier] = useState("");
  const [pTracking, setPTracking] = useState("");
  const [pResId, setPResId] = useState("");

  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isSecurity = roleName === "SECURITY" || roleName === "ADMIN";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vData, pData] = await Promise.all([fetchVisitors(), fetchParcels()]);
      setVisitors(vData || []);
      setParcels(pData || []);
    } catch (err) {
      console.error("❌ Load Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResidents = useCallback(async () => {
    if (!isSecurity) return;
    try {
      const data = await fetchResidents();
      setResidents(data || []);
    } catch (err) {
      console.error("❌ Residents fetch failed:", err.message);
    }
  }, [isSecurity]);

  useEffect(() => {
    if (!authLoading && profile) {
      loadData();
      loadResidents();
    }
  }, [authLoading, profile, loadData, loadResidents]);

  // Handler: Visitor Entry
  const handleVisitorEntry = async (e) => {
    e.preventDefault();
    try {
      await createVisitor({ 
        visitor_name: vName, 
        visitor_phone: "", 
        purpose: vPurpose, 
        resident_id: vResId 
      });
      alert("Visitor Logged ✅");
      setVName(""); setVPurpose(""); setVResId("");
      loadData();
    } catch (err) { alert(err.message); }
  };

  // Handler: Parcel Entry
  const handleParcelEntry = async (e) => {
    e.preventDefault();
    try {
      await createParcel({ 
        courier_name: pCourier, 
        tracking_number: pTracking, 
        resident_id: pResId 
      });
      alert("Parcel Logged ✅");
      setPCourier(""); setPTracking(""); setPResId("");
      loadData();
    } catch (err) { alert(err.message); }
  };
  console.log("RESIDENT parcels:", parcels);
  // 1. First, wait for auth to finish
  if (authLoading) return <div style={{ padding: 40 }}>Verifying session...</div>;

  // 2. ✅ STEP 1: RESTRICT ACCESS GUARD
  // If user is logged in but NOT Security/Admin, show Access Denied
  if (!isSecurity) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3>🚫 Access Denied</h3>
        <p>This page is reserved for Security and Admin personnel only.</p>
      </div>
    );
  }

  // 3. Render the full page for authorized users
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Gate Management</h2>
        <button onClick={loadData}>Refresh Data</button>
      </div>

      {/* --- FORMS (Security/Admin Only) --- */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <div style={{ background: "#fff", padding: 20, borderRadius: 8, flex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Visitor Entry</h3>
          <form onSubmit={handleVisitorEntry}>
            <input style={inputStyle} placeholder="Visitor Name" value={vName} onChange={e => setVName(e.target.value)} required />
            <input style={inputStyle} placeholder="Purpose (e.g. Delivery)" value={vPurpose} onChange={e => setVPurpose(e.target.value)} required />
            
            <select
              style={inputStyle}
              value={vResId}
              onChange={(e) => setVResId(e.target.value)}
              required
            >
              <option value="">Select Resident</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name}
                </option>
              ))}
            </select>

            <button type="submit" style={btnStyle}>Log Entry</button>
          </form>
        </div>

        <div style={{ background: "#fff", padding: 20, borderRadius: 8, flex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>New Parcel Arrival</h3>
          <form onSubmit={handleParcelEntry}>
            <input style={inputStyle} placeholder="Courier (e.g. Amazon)" value={pCourier} onChange={e => setPCourier(e.target.value)} required />
            <input style={inputStyle} placeholder="Tracking # (Optional)" value={pTracking} onChange={e => setPTracking(e.target.value)} />
            
            <select
              style={inputStyle}
              value={pResId}
              onChange={(e) => setPResId(e.target.value)}
              required
            >
              <option value="">Select Resident</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name}
                </option>
              ))}
            </select>

            <button type="submit" style={btnStyle}>Log Parcel</button>
          </form>
        </div>
      </div>

      {/* --- VISITORS TABLE --- */}
      <div style={tableContainerStyle}>
        <h3>Recent Visitors</h3>
        {loading ? <p>Updating list...</p> : (
          <table width="100%" cellPadding="12" style={tableStyle}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th align="left">Visitor</th><th align="left">Purpose</th><th align="left">Entry</th><th align="left">Exit</th><th align="left">Action</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map(v => (
                <tr key={v.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td><strong>{v.visitor_name}</strong></td>
                  <td>{v.purpose}</td>
                  <td>{v.entry_time ? new Date(v.entry_time).toLocaleString() : "-"}</td>
                  <td>{v.exit_time ? new Date(v.exit_time).toLocaleString() : "Inside"}</td>
                  <td>
                    {!v.exit_time && (
                      <button onClick={() => markVisitorExit(v.id).then(loadData)}>Mark Exit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- PARCELS TABLE --- */}
      <div style={tableContainerStyle}>
        <h3>Parcels</h3>
        {loading ? <p>Updating list...</p> : (
          <table width="100%" cellPadding="12" style={tableStyle}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th align="left">Courier</th><th align="left">Status</th><th align="left">Received At</th><th align="left">Action</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{p.courier_name} {p.tracking_number && `(${p.tracking_number})`}</td>
                  <td><span style={{ color: p.status === 'PICKED_UP' ? 'green' : 'orange' }}>{p.status}</span></td>
                  <td>{p.received_at ? new Date(p.received_at).toLocaleString() : "-"}</td>
                  <td>
                    {p.status === "RECEIVED" && (
                      <button onClick={() => markParcelPickedUp(p.id).then(loadData)}>Mark Picked Up</button>
                    )}
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

const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd' };
const btnStyle = { width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const tableContainerStyle = { background: "#fff", padding: 20, borderRadius: 8, marginBottom: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const tableStyle = { borderCollapse: "collapse" };