import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  fetchFacilityBookings,
  updateFacilityBookingStatus,
} from "../../api/facilities.api";

export default function FacilityBookingsPage() {
  const { profile, loading: authLoading } = useAuth();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    try {
      setLoading(true);
      const data = await fetchFacilityBookings();
      setBookings(data || []);
    } catch (err) {
      console.log("❌ Facility bookings fetch failed:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && profile) {
      loadBookings();
    }
    // eslint-disable-next-line
  }, [authLoading, profile]);

  async function handleUpdateStatus(id, status) {
    try {
      await updateFacilityBookingStatus(id, status);
      alert(`Booking ${status} ✅`);
      await loadBookings();
    } catch (err) {
      alert(err.message);
    }
  }

  if (authLoading || !profile) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Verifying session...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Facility Bookings</h2>

      <button onClick={loadBookings} style={{ marginBottom: 16 }}>
        Refresh
      </button>

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th align="left">Facility</th>
              <th align="left">Start</th>
              <th align="left">End</th>
              <th align="left">Status</th>
              <th align="left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{b.facilities?.name || b.facility_id}</td>
                <td>{new Date(b.start_time).toLocaleString()}</td>
                <td>{new Date(b.end_time).toLocaleString()}</td>
                <td>
                  <strong>{b.status}</strong>
                </td>

                <td>
                  {isAdmin ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        disabled={b.status !== "PENDING"}
                        onClick={() => handleUpdateStatus(b.id, "APPROVED")}
                      >
                        Approve
                      </button>

                      <button
                        disabled={b.status === "CANCELLED"}
                        onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: "#777" }}>No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
