import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../../lib/supabase";

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = "http://localhost:4000/api"; // Updated for consistency

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
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
    if (!window.confirm("Are you sure you want to cancel this registration?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await axios.patch(
        `${BACKEND_URL}/events/my/${registrationId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Registration cancelled successfully ✅");
      fetchMyEvents(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.error || "Cancellation failed");
    }
  };

  if (loading) return <p>Loading your registered events...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Registered Events</h2>

      {events.length === 0 ? (
        <div style={{ padding: "20px", background: "#f9fafb", borderRadius: "8px" }}>
          <p>You have not registered for any events yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {events.map((item) => (
            <div
              key={item.registration_id}
              style={{
                border: "1px solid #e5e7eb",
                padding: "20px",
                borderRadius: "12px",
                background: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                opacity: item.status === "CANCELLED" ? 0.6 : 1
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#1e40af" }}>{item.title}</h3>
                {item.status === "CANCELLED" && (
                   <span style={{ color: "red", fontWeight: "bold" }}>CANCELLED</span>
                )}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "14px" }}>
                <p><strong>📅 Date:</strong> {new Date(item.event_date).toLocaleString()}</p>
                <p><strong>📍 Venue:</strong> {item.location || item.venue || "N/A"}</p>
                
                <p>
                  <strong>💳 Status:</strong> 
                  <span style={{ 
                    marginLeft: "8px",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: item.payment_status === "PAID" ? "#dcfce7" : "#fee2e2",
                    color: item.payment_status === "PAID" ? "#166534" : "#991b1b",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    {item.payment_status}
                  </span>
                </p>
                
                <p><strong>🛠 Method:</strong> {item.payment_method || "Pending"}</p>
              </div>

              {item.status !== "CANCELLED" && (
                <button
                  onClick={() => cancelRegistration(item.registration_id)}
                  style={{
                    marginTop: "15px",
                    padding: "8px 16px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  Cancel Registration
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;