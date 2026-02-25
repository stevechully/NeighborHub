import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { fetchFacilities } from "../../api/facilities.api";

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isResident = roleName === "RESIDENT";

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadFacilities() {
    try {
      setLoading(true);
      const data = await fetchFacilities();
      setFacilities(data || []);
    } catch (err) {
      console.log("❌ Facilities fetch failed:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && profile) {
      loadFacilities();
    }
    // eslint-disable-next-line
  }, [authLoading, profile]);

  if (authLoading || !profile) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Verifying session...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Facilities</h2>

        <button 
          onClick={() => navigate("/facilities/bookings")}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          My Bookings
        </button>
      </div>

      {loading ? (
        <p>Loading facilities...</p>
      ) : facilities.length === 0 ? (
        <p>No facilities available.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          {facilities.map((f) => (
            <div
              key={f.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                border: "1px solid #eee",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <h3 style={{ marginTop: 0 }}>{f.name}</h3>

                <p style={{ color: "#555", minHeight: 40 }}>
                  {f.description || "No description"}
                </p>

                <div style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>
                  <div><strong>Capacity:</strong> {f.capacity ?? "N/A"}</div>
                  <div><strong>Open:</strong> {f.open_time} → {f.close_time}</div>
                  <div><strong>Paid:</strong> {f.is_paid ? "Yes" : "No"}</div>
                  {f.is_paid && <div><strong>Fee:</strong> ₹{f.fee}</div>}
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee" }}>
                {isResident ? (
                  <button
                    onClick={() => navigate(`/facilities/${f.id}`)}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: "#111",
                      color: "#fff",
                      fontWeight: "600",
                    }}
                  >
                    View Availability & Book
                  </button>
                ) : (
                  <p style={{ color: "#777", fontSize: 13, textAlign: "center" }}>
                    Residents only
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}