import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { fetchFacilities, bookFacility } from "../../api/facilities.api";

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isResident = roleName === "RESIDENT";

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  // booking form values per facility
  const [bookingForm, setBookingForm] = useState({});
  // bookingForm = { [facilityId]: { start_time: "", end_time: "" } }

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

  function handleChange(facilityId, field, value) {
    setBookingForm((prev) => ({
      ...prev,
      [facilityId]: {
        ...prev[facilityId],
        [field]: value,
      },
    }));
  }

  async function handleBook(facilityId) {
    const start_time = bookingForm?.[facilityId]?.start_time;
    const end_time = bookingForm?.[facilityId]?.end_time;

    if (!start_time || !end_time) {
      alert("Please select start and end time");
      return;
    }

    // Convert to ISO string (safe for timestamp columns)
    const startISO = new Date(start_time).toISOString();
    const endISO = new Date(end_time).toISOString();

    if (new Date(endISO) <= new Date(startISO)) {
      alert("End time must be after start time");
      return;
    }

    try {
      await bookFacility(facilityId, {
        start_time: startISO,
        end_time: endISO,
      });

      alert("Facility booking request created ✅ (PENDING)");

      // reset this facility form
      setBookingForm((prev) => ({
        ...prev,
        [facilityId]: { start_time: "", end_time: "" },
      }));
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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Facilities</h2>

        <button onClick={() => navigate("/facilities/bookings")}>
          View Bookings
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
              }}
            >
              <h3 style={{ marginTop: 0 }}>{f.name}</h3>

              <p style={{ color: "#555", minHeight: 40 }}>
                {f.description || "No description"}
              </p>

              <div style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>
                <div>
                  <strong>Capacity:</strong> {f.capacity ?? "N/A"}
                </div>
                <div>
                  <strong>Open:</strong> {f.open_time} → {f.close_time}
                </div>
                <div>
                  <strong>Paid:</strong> {f.is_paid ? "Yes" : "No"}
                </div>
                {f.is_paid && (
                  <div>
                    <strong>Fee:</strong> ₹{f.fee}
                  </div>
                )}
                <div>
                  <strong>Approval Required:</strong>{" "}
                  {f.approval_required ? "Yes" : "No"}
                </div>
              </div>

              {/* Booking UI only for RESIDENT */}
              {isResident ? (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #eee",
                  }}
                >
                  <h4 style={{ margin: "0 0 10px 0" }}>Book Facility</h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 13 }}>Start Time</label>
                      <input
                        type="datetime-local"
                        value={bookingForm?.[f.id]?.start_time || ""}
                        onChange={(e) =>
                          handleChange(f.id, "start_time", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #ddd",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 13 }}>End Time</label>
                      <input
                        type="datetime-local"
                        value={bookingForm?.[f.id]?.end_time || ""}
                        onChange={(e) =>
                          handleChange(f.id, "end_time", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #ddd",
                        }}
                      />
                    </div>

                    <button
                      onClick={() => handleBook(f.id)}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background: "#111",
                        color: "#fff",
                        fontWeight: "600",
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ marginTop: 12, color: "#777", fontSize: 13 }}>
                  Booking is available for residents only.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
