import { useEffect, useState, useCallback } from "react"; // ✅ Added useCallback
import { useAuth } from "../../auth/AuthContext";
import { useLocation } from "react-router-dom"; 
import {
  fetchFacilityBookings,
  fetchMyFacilityBookings,
  updateFacilityBookingStatus,
  cancelFacilityBooking,
  payForFacilityBooking,
  requestFacilityRefund,
} from "../../api/facilities.api";

export default function FacilityBookingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const location = useLocation();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";
  const isMyBookingsPage = location.pathname.includes("my-bookings");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Wrapped in useCallback to fix the ESLint dependency warning
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = (isAdmin && !isMyBookingsPage)
        ? await fetchFacilityBookings()
        : await fetchMyFacilityBookings();
      
      setBookings(data || []);
    } catch (err) {
      console.log("❌ Facility bookings fetch failed:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isMyBookingsPage]); 

  useEffect(() => {
    if (!authLoading && profile) {
      loadBookings();
    }
  }, [authLoading, profile, loadBookings]); // ✅ loadBookings is now a stable dependency

  async function handleUpdateStatus(id, status) {
    try {
      if (status === "CANCELLED") {
        await cancelFacilityBooking(id);
      } else {
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

  async function handleRefundRequest(paymentId) {
    const reason = window.prompt("Reason for refund?", "Change of plans");
    if (!reason) return;

    try {
      await requestFacilityRefund(paymentId, reason);
      alert("Refund request submitted! 🟡");
      await loadBookings();
    } catch (err) {
      alert(err.message || "Refund request failed");
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
      <h2>{isMyBookingsPage ? "My Facility Bookings" : "Facility Bookings Management"}</h2>

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
                             ['CONFIRMED', 'APPROVED'].includes(b.status) ? '#27ae60' : '#777' 
                    }}
                  >
                    {b.status}
                  </strong>
                  {b.status === "RESERVED" && b.expires_at && (
                    <div style={{ fontSize: '0.8rem', color: '#e74c3c' }}>
                      Expires: {new Date(b.expires_at).toLocaleTimeString()}
                    </div>
                  )}
                  {b.facility_payments?.refund_status === "REQUESTED" && (
                    <div style={{ fontSize: '0.75rem', color: '#f39c12', marginTop: 4 }}>
                      🟡 Refund Requested
                    </div>
                  )}
                  {b.facility_payments?.refund_status === "REFUNDED" && (
                    <div style={{ fontSize: '0.75rem', color: '#27ae60', marginTop: 4 }}>
                      🟢 Refunded
                    </div>
                  )}
                </td>

                <td>
                  {isAdmin && !isMyBookingsPage ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        disabled={!["RESERVED", "CONFIRMED"].includes(b.status)}
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
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {b.status === "RESERVED" && (
                        <button 
                          onClick={() => handlePayment(b.id)}
                          style={{ backgroundColor: "#2ecc71", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Pay Now
                        </button>
                      )}
                      
                      {["CONFIRMED", "APPROVED"].includes(b.status) && 
                       (!b.facility_payments || b.facility_payments.refund_status === "NONE") && (
                        <button 
                          onClick={() => b.facility_payments ? handleRefundRequest(b.facility_payments.id) : alert("No payment found")}
                          style={{ backgroundColor: "#f39c12", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Request Refund
                        </button>
                      )}

                      {["RESERVED", "CONFIRMED", "APPROVED"].includes(b.status) && 
                       (!b.facility_payments || b.facility_payments.refund_status === "NONE") ? (
                        <button onClick={() => handleUpdateStatus(b.id, "CANCELLED")}>
                          Cancel
                        </button>
                      ) : (
                        (!b.facility_payments || b.facility_payments.refund_status === "NONE") && 
                        !["RESERVED", "CONFIRMED", "APPROVED"].includes(b.status) && 
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