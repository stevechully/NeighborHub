import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { createEvent, deleteEvent, fetchEvents, registerForEvent, payForEvent } from "../../api/events.api";

// ✅ Added Import
import EventCard from "../../components/events/EventCard";

export default function EventsPage() {
  const { profile, loading: authLoading } = useAuth();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";
  const isResident = roleName === "RESIDENT";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // create event form (admin)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [isPaid, setIsPaid] = useState(false);
  const [fee, setFee] = useState("");

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
    // eslint-disable-next-line
  }, [authLoading, profile]);

  async function handleCreateEvent(e) {
    e.preventDefault();

    if (!title || !eventDate || !location || !capacity) {
      alert("Missing required fields");
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
      alert("Event created ✅");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRegister(eventId) {
    try {
      const res = await registerForEvent(eventId);

      if (res.payment_status === "PENDING") {
        alert("Registration created. Please pay to confirm your spot.");
      } else {
        alert("Registered successfully ✅");
      }

      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePay(eventId) {
    try {
      const res = await payForEvent(eventId, {
        payment_method: "MOCK_UPI"
      });

      alert("Payment successful ✅ Ref: " + res.transaction_ref);
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteEvent(id) {
    if (!window.confirm("Delete this event?")) return;

    try {
      await deleteEvent(id);
      alert("Event deleted ✅");
      await loadEvents();
    } catch (err) {
      alert(err.message);
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
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

      {/* ✅ REPLACED: EVENT LIST GRID */}
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
                onRegister={() => handleRegister(e.id)}
                onPay={() => handlePay(e.id)}
                onDelete={() => handleDeleteEvent(e.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}