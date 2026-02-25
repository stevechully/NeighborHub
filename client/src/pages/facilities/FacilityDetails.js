import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  fetchFacilities, 
  fetchFacilityBookingsByDate, 
  bookFacility 
} from "../../api/facilities.api";
import { generateSlots, isSlotBooked } from "../../utils/slotHelpers";

export default function FacilityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  
  const [facility, setFacility] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Facility Data
  useEffect(() => {
    async function loadFacility() {
      try {
        const data = await fetchFacilities();
        const found = data.find((f) => f.id === id);
        setFacility(found);
      } catch (err) {
        alert("Error loading facility");
      } finally {
        setLoading(false);
      }
    }
    loadFacility();
  }, [id]);

  // 2. Fetch existing bookings when date or ID changes
  useEffect(() => {
    async function loadBookings() {
      try {
        const data = await fetchFacilityBookingsByDate(id, selectedDate);
        setBookings(data || []);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      }
    }

    if (selectedDate && id) {
      loadBookings();
    }
  }, [selectedDate, id]);

  const handleBooking = async (slot) => {
    try {
      const payload = {
        start_time: slot.start.toISOString(),
        end_time: slot.end.toISOString()
      };

      const result = await bookFacility(id, payload);
      
      if (result.status === "RESERVED") {
        alert("Slot Reserved! Redirecting to your bookings to pay...");
        navigate("/facilities/bookings"); 
      } else {
        alert("Booking Confirmed! ✅");
        // To refresh slots after booking, we'd need to call loadBookings again.
        // A simple way is to just trigger the useEffect by re-setting the date
        const currentDate = selectedDate;
        setSelectedDate("");
        setTimeout(() => setSelectedDate(currentDate), 10);
      }
    } catch (err) {
      alert(err.message || "Booking failed");
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading facility details...</div>;
  if (!facility) return <div style={{ padding: 20 }}>Facility not found.</div>;

  const slots = selectedDate 
    ? generateSlots(facility.open_time, facility.close_time, 60, selectedDate) 
    : [];

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        ← Back to Facilities
      </button>

      <h2>{facility.name}</h2>
      <p>{facility.description}</p>
      <p><strong>Fee:</strong> {facility.is_paid ? `₹${facility.fee}` : "Free"}</p>

      <div style={{ marginBottom: 20 }}>
        <label><strong>Select Date: </strong></label>
        <input
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: 8, borderRadius: 5, border: "1px solid #ccc" }}
        />
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", 
        gap: 12 
      }}>
        {selectedDate && slots.map((slot, index) => {
          const booked = isSlotBooked(slot, bookings);
          return (
            <button
              key={index}
              disabled={booked}
              onClick={() => handleBooking(slot)}
              style={{
                padding: "15px",
                cursor: booked ? "not-allowed" : "pointer",
                backgroundColor: booked ? "#eee" : "#4CAF50",
                color: booked ? "#999" : "white",
                border: "1px solid #ccc",
                borderRadius: "8px",
                fontWeight: "bold"
              }}
            >
              {slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {booked && <div style={{ fontSize: '10px', fontWeight: 'normal' }}>Unavailable</div>}
            </button>
          );
        })}
      </div>
      
      {!selectedDate && (
        <p style={{ color: "#666", backgroundColor: "#f9f9f9", padding: 15, borderRadius: 8 }}>
          Please select a date above to view available time slots.
        </p>
      )}
    </div>
  );
}