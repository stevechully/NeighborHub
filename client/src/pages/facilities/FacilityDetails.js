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

  // ✅ Step 1: Add State for the Selected Slot and Modal
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
        // To refresh slots after booking, re-set the date to trigger useEffect
        const currentDate = selectedDate;
        setSelectedDate("");
        setTimeout(() => setSelectedDate(currentDate), 10);
      }
    } catch (err) {
      alert(err.message || "Booking failed");
    }
  };

  if (loading) return <div className="p-10 text-slate-500">Loading facility details...</div>;
  if (!facility) return <div className="p-10 text-slate-500">Facility not found.</div>;

  const slots = selectedDate 
    ? generateSlots(facility.open_time, facility.close_time, 60, selectedDate) 
    : [];

  return (
    <div className="max-w-5xl mx-auto p-6 relative">
      
      <button 
        onClick={() => navigate(-1)} 
        className="text-indigo-600 hover:text-indigo-800 font-medium mb-6 flex items-center gap-2 transition-colors"
      >
        <span>←</span> Back to Facilities
      </button>

      {/* Modern Facility Header */}
      <div className="bg-white border rounded-xl p-6 shadow-sm mb-6">
        <h1 className="text-2xl font-semibold">
          {facility.name}
        </h1>

        <p className="text-gray-500 mt-1">
          {facility.description}
        </p>

        <div className="flex gap-6 mt-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Fee:</span>{" "}
            {facility.is_paid ? `₹${facility.fee}` : "Free"}
          </div>

          <div>
            <span className="font-medium">Open:</span>{" "}
            {facility.open_time}
          </div>

          <div>
            <span className="font-medium">Close:</span>{" "}
            {facility.close_time}
          </div>
        </div>
      </div>

      {/* Modern Date Picker */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <label className="font-medium text-slate-700">
          Select Date
        </label>

        <input
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="block mt-2 border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
        />
      </div>

      {/* Modern Slot Grid & Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {selectedDate && slots.map((slot, index) => {
          const booked = isSlotBooked(slot, bookings);
          return (
            <button
              key={index}
              disabled={booked}
              // ✅ Step 2: Update onClick to open the modal
              onClick={() => {
                setSelectedSlot(slot);
                setConfirmOpen(true);
              }}
              className={`p-3 rounded-lg text-sm font-medium transition flex flex-col items-center justify-center
                ${
                  booked
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                }`}
            >
              <span>
                {slot.start.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>

              {booked && (
                <div className="text-xs mt-0.5 opacity-80">
                  Unavailable
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Improve Empty State */}
      {!selectedDate && (
        <div className="bg-gray-50 border rounded-xl p-4 text-gray-600 text-center mt-6">
          Please select a date above to view available time slots.
        </div>
      )}

      {/* ✅ Step 3: Create the Confirmation Modal */}
      {confirmOpen && selectedSlot && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[360px] shadow-lg">
            
            <h3 className="text-lg font-semibold mb-2">
              Confirm Booking
            </h3>
            
            <p className="text-gray-600 mb-2">
              Book <strong>{facility.name}</strong> at
            </p>
            
            <div className="text-2xl font-semibold mb-6 text-indigo-600">
              {selectedSlot.start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  handleBooking(selectedSlot);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Confirm Booking
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}