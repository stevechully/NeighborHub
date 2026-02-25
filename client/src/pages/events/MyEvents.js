import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../../lib/supabase";
import { requestEventRefund } from "../../api/events.api";

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = "http://localhost:4000/api";

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await axios.get(
        `${BACKEND_URL}/events/my`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching my events:", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelRegistration = async (registrationId) => {
    if (!window.confirm("Cancel this registration?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await axios.patch(
        `${BACKEND_URL}/events/my/${registrationId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Registration cancelled ✅");
      fetchMyEvents();
    } catch (err) {
      alert(err.response?.data?.error || "Cancellation failed");
    }
  };

  const handleRefundRequest = async (paymentId) => {
    if (!paymentId) return; // 👈 prevents crash

    const reason = window.prompt("Reason for refund?", "Unable to attend");
    if (!reason) return;

    try {
      await requestEventRefund(paymentId, reason);
      alert("Refund request submitted 🟡");
      fetchMyEvents();
    } catch (err) {
      alert(err.message || "Refund failed");
    }
  };

  if (loading) return <p>Loading your registered events...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Registered Events</h2>

      {events.length === 0 ? (
        <p>No registered events yet.</p>
      ) : (
        events.map((item) => (
          <div
            key={item.registration_id}
            style={{
              border: "1px solid #e5e7eb",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "15px",
              background: "#fff",
              opacity: item.status === "CANCELLED" ? 0.6 : 1
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>{item.title}</h3>

            <p><strong>Date:</strong> {new Date(item.event_date).toLocaleString()}</p>
            <p><strong>Location:</strong> {item.location || "N/A"}</p>
            <p><strong>Payment:</strong> {item.payment_status}</p>

            {item.event_payments?.refund_status === "REQUESTED" && (
              <p style={{ color: "#f39c12" }}>🟡 Refund Requested</p>
            )}

            {item.event_payments?.refund_status === "REFUNDED" && (
              <p style={{ color: "#166534" }}>🟢 Refunded</p>
            )}

            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              {item.status !== "CANCELLED" && (
                <button
                  onClick={() => cancelRegistration(item.registration_id)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Cancel Registration
                </button>
              )}

              {item.payment_status === "PAID" &&
               item.status !== "CANCELLED" &&
               item.event_payments &&
               item.event_payments.refund_status === "NONE" && (
                <button
                  onClick={() => handleRefundRequest(item.event_payments.id)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#f39c12",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Request Refund
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyEvents;