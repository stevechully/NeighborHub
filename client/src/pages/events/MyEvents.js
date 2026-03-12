import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../../lib/supabase";
import { requestEventRefund } from "../../api/events.api";

// Component Import
import EventTicketCard from "../../components/events/EventTicketCard";

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ NEW: State for our modern Toast Notification
  const [toastMsg, setToastMsg] = useState("");

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

  // Helper to show the toast and auto-hide it after 3 seconds
  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm("Cancel this registration?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await axios.patch(
        `${BACKEND_URL}/events/my/${registrationId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ OPTIMISTIC UI: Remove the event from state instantly
      setEvents((prev) => prev.filter((e) => e.registration_id !== registrationId));

      // ✅ BETTER UX: Show a toast instead of an alert
      showToast("Registration cancelled ✅");
      
    } catch (err) {
      alert(err.response?.data?.error || "Cancellation failed");
    }
  };

  const handleRefundRequest = async (paymentId) => {
    if (!paymentId) return; 

    const reason = window.prompt("Reason for refund?", "Unable to attend");
    if (!reason) return;

    try {
      await requestEventRefund(paymentId, reason);
      
      // ✅ OPTIMISTIC UI: Update the specific event's refund status instantly
      setEvents((prev) => 
        prev.map((e) => 
          e.event_payments?.id === paymentId 
            ? { ...e, event_payments: { ...e.event_payments, refund_status: "REQUESTED" } } 
            : e
        )
      );

      showToast("Refund request submitted 🟡");

    } catch (err) {
      alert(err.message || "Refund failed");
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center">
        <p className="text-slate-500 font-medium animate-pulse">Loading your registered events...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 relative">
      
      {/* Header */}
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">My Tickets</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your upcoming event registrations</p>
      </div>

      {/* Event Ticket List */}
      {events.length === 0 ? (
        <p className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          No registered events yet.
        </p>
      ) : (
        <div className="space-y-4">
          {events.map((e) => (
            <EventTicketCard
              key={e.registration_id} 
              event={e}
              onCancel={() => handleCancelRegistration(e.registration_id)}
              onRequestRefund={handleRefundRequest}
            />
          ))}
        </div>
      )}

      {/* ✅ NEW: Modern Toast Notification Component */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium flex items-center gap-3 transition-all z-50 animate-bounce-in">
          {toastMsg}
        </div>
      )}
      
    </div>
  );
};

export default MyEvents;