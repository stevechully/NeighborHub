import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { createEvent, deleteEvent, fetchEvents, registerForEvent } from "../../api/events.api";
import { AlertTriangle, Loader2 } from "lucide-react"; // ✅ Imported icons for the new modal

// Components
import EventCard from "../../components/events/EventCard";
import PaymentModal from "../../components/payments/PaymentModal";

export default function EventsPage() {
  const { profile, loading: authLoading } = useAuth();

  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isAdmin = roleName === "ADMIN";
  const isResident = roleName === "RESIDENT";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [paymentEvent, setPaymentEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null); // ✅ State for delete modal
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast State
  const [toastMsg, setToastMsg] = useState("");

  // create event form (admin)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [isPaid, setIsPaid] = useState(false);
  const [fee, setFee] = useState("");

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(""), 3000);
  };

  async function loadEvents() {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data || []);
    } catch (err) {
      console.log("❌ Events fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && profile) {
      loadEvents();
    }
  }, [authLoading, profile]);

  async function handleCreateEvent(e) {
    e.preventDefault();

    if (!title || !eventDate || !location || !capacity) {
      showToast("⚠️ Missing required fields");
      return;
    }

    try {
      await createEvent({
        title,
        description,
        event_date: new Date(eventDate).toISOString(),
        location,
        capacity: Number(capacity),
        is_paid: isPaid,
        fee: isPaid ? Number(fee) : 0
      });

      setTitle("");
      setDescription("");
      setEventDate("");
      setLocation("");
      setCapacity(10);
      setIsPaid(false);
      setFee("");

      await loadEvents();
      showToast("Event created ✅");
    } catch (err) {
      showToast("❌ " + err.message);
    }
  }

  async function handleRegister(event) {
    try {
      const res = await registerForEvent(event.id);

      if (res.payment_status === "PENDING") {
        setPaymentEvent(event);
      } else {
        showToast("Registered successfully ✅");
        loadEvents();
      }
    } catch (err) {
      showToast("❌ " + (err.response?.data?.error || err.message || "Registration failed"));
    }
  }

  function handlePay(event) {
    setPaymentEvent(event);
  }

  // ✅ Triggered when Admin clicks "Delete" on the card
  function handleDeleteClick(id) {
    setEventToDelete(id);
  }

  // ✅ Executes the actual deletion after confirmation
  async function executeDelete() {
    if (!eventToDelete) return;

    try {
      setIsDeleting(true);
      await deleteEvent(eventToDelete);
      showToast("Event deleted ✅");
      await loadEvents();
    } catch (err) {
      showToast("❌ " + err.message);
    } finally {
      setIsDeleting(false);
      setEventToDelete(null); // Close modal
    }
  }

  if (authLoading || !profile) {
    return (
      <div className="p-10 flex justify-center items-center">
        <p className="text-slate-500 font-medium animate-pulse">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Community Events</h2>
          <p className="text-sm text-slate-500 mt-1">Discover and join upcoming activities</p>
        </div>
        <button 
          onClick={loadEvents}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          Refresh
        </button>
      </div>

      {/* ADMIN CREATE EVENT */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Create Event (Admin)</h3>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="e.g., Summer Yoga Camp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="e.g., Main Clubhouse"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Details about the event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min={1}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex items-center h-[42px] px-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 text-sm">
                  <input 
                    type="checkbox" 
                    checked={isPaid} 
                    onChange={(e) => setIsPaid(e.target.checked)} 
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  /> 
                  Paid Event
                </label>
              </div>
            </div>

            {isPaid && (
              <div className="w-1/4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fee (₹)</label>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  min={0}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Amount"
                />
              </div>
            )}

            <button 
              type="submit"
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
            >
              Create Event
            </button>
          </form>
        </div>
      )}

      {/* EVENT LIST GRID */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Upcoming Events</h3>

        {loading ? (
          <p className="text-slate-500 py-10 text-center">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No events found.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                isAdmin={isAdmin}
                isResident={isResident}
                onRegister={() => handleRegister(e)}
                onPay={() => handlePay(e)}
                onDelete={() => handleDeleteClick(e.id)} /* ✅ Now triggers the modal */
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* PREMIUM PAYMENT MODAL */}
      <PaymentModal
        isOpen={!!paymentEvent}
        onClose={() => setPaymentEvent(null)}
        module="EVENT"
        itemName={paymentEvent?.title}
        amount={paymentEvent?.fee}
        referenceId={paymentEvent?.id}
        onSuccess={() => {
          setPaymentEvent(null);
          loadEvents();
        }}
      />

      {/* 🛑 ADMIN DELETE CONFIRMATION MODAL */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Event?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete this event? This action cannot be undone and will remove all registrations.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setEventToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors flex justify-center items-center"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={20} /> : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium flex items-center gap-3 transition-all z-50 animate-bounce-in">
          {toastMsg}
        </div>
      )}

    </div>
  );
}