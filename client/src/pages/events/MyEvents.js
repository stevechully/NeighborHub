import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../../lib/supabase"; // ✅ Import supabase client

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      // ✅ 1. Get the session directly from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      // ✅ 2. Extract the access token
      const token = session?.access_token;

      // ✅ 3. Execute the request with the fresh token
      const res = await axios.get(
        "http://localhost:4000/api/events/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("My Events Response:", res.data);
      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching my events:", err);
    } finally {
      setLoading(false);
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
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#1e40af" }}>{item.title}</h3>
              
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;