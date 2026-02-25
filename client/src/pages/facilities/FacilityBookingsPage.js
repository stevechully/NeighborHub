import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  fetchFacilityBookings,
  updateFacilityBookingStatus,
  cancelFacilityBooking, // ✅ Added this
  payForFacilityBooking,
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
      if (status === "CANCELLED") {
        // ✅ Call the ownership-aware cancel route
        await cancelFacilityBooking(id);
      } else {
        // Use standard update for Admin approvals
        await updateFacilityBookingStatus(id, status);
      }
      alert(`Booking ${status} ✅`);
      await loadBookings();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePayment(id) {
    const method = window.prompt("Enter payment method (e.g., Credit Card, Cash):", "Credit Card");
    if (!method) return;

    try {
      await payForFacilityBooking(id, method);
      alert("Payment successful! Booking Confirmed.");
      await loadBookings();
    } catch (err) {
      alert("Payment failed: " + err.message);
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
                  <strong 
                    style={{ 
                      color: b.status === 'RESERVED' ? '#e67e22' : 
                             b.status === 'CONFIRMED' ? '#27ae60' : 'inherit' 
                    }}
                  >
                    {b.status}
                  </strong>
                  {b.status === "RESERVED" && b.expires_at && (
                    <div style={{ fontSize: '0.8rem', color: '#e74c3c' }}>
                      Expires: {new Date(b.expires_at).toLocaleTimeString()}
                    </div>
                  )}
                </td>

                <td>
                  {isAdmin ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        disabled={!["PENDING", "CONFIRMED"].includes(b.status)}
                        onClick={() => handleUpdateStatus(b.id, "APPROVED")}
                        style={{ backgroundColor: b.status === "CONFIRMED" ? "#d4edda" : "" }}
                      >
                        Approve
                      </button>

                      <button
                        disabled={["CANCELLED", "EXPIRED"].includes(b.status)}
                        onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                      {b.status === "RESERVED" && (
                        <button 
                          onClick={() => handlePayment(b.id)}
                          style={{ backgroundColor: "#2ecc71", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Pay Now
                        </button>
                      )}
                      
                      {b.status !== "CANCELLED" && b.status !== "EXPIRED" && b.status !== "APPROVED" ? (
                        <button onClick={() => handleUpdateStatus(b.id, "CANCELLED")}>
                          Cancel
                        </button>
                      ) : (
                        <span style={{ color: "#777" }}>No actions</span>
                      )}
                    </div>
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