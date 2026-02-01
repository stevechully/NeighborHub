import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { createEvent, deleteEvent, fetchEvents, joinEvent } from "../../api/events.api";

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
      });

      setTitle("");
      setDescription("");
      setEventDate("");
      setLocation("");
      setCapacity(10);

      await loadEvents();
      alert("Event created ✅");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleJoinEvent(id) {
    try {
      await joinEvent(id);
      alert("Joined event ✅");
      await loadEvents();
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
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Verifying session...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Events</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={loadEvents}>Refresh</button>
      </div>

      {/* ADMIN CREATE EVENT */}
      {isAdmin && (
        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <h3>Create Event (Admin)</h3>

          <form onSubmit={handleCreateEvent}>
            <div style={{ marginBottom: 10 }}>
              <label>Title</label>
              <br />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Description</label>
              <br />
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <div>
                <label>Date & Time</label>
                <br />
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>

              <div>
                <label>Location</label>
                <br />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label>Capacity</label>
                <br />
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min={1}
                />
              </div>
            </div>

            <button type="submit">Create Event</button>
          </form>
        </div>
      )}

      {/* EVENT LIST */}
      <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
        <h3>Upcoming Events</h3>

        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p>No events found.</p>
        ) : (
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f3f3" }}>
                <th align="left">Title</th>
                <th align="left">Date</th>
                <th align="left">Location</th>
                <th align="left">Capacity</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>
                    <strong>{e.title}</strong>
                    <div style={{ color: "#666", fontSize: 13 }}>{e.description}</div>
                  </td>
                  <td>{new Date(e.event_date).toLocaleString()}</td>
                  <td>{e.location}</td>
                  <td>{e.capacity}</td>
                  <td>
                    {isResident && (
                      <button onClick={() => handleJoinEvent(e.id)}>
                        Join
                      </button>
                    )}

                    {isAdmin && (
                      <button onClick={() => handleDeleteEvent(e.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
