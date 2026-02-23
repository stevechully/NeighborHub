import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  createWorkerBooking,
  fetchWorkerBookings,
  updateWorkerBookingStatus,
  assignWorkerToBooking,
} from "../../api/workerServices.api";
import { fetchWorkers } from "../../api/admin.api";

export default function WorkerServicesPage() {
  const { profile, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true); 
  const [statusFilter, setStatusFilter] = useState("");

  const [serviceCategory, setServiceCategory] = useState("PLUMBER");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState({});

  // Role Detection
  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isAdmin = roleName === "ADMIN";
  const isWorker = roleName === "WORKER";
  const isResident = roleName === "RESIDENT";

  const statusOptions = useMemo(
    () => ["REQUESTED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    []
  );

  const loadBookings = useCallback(async () => {
    try {
      setDataLoading(true);
      const data = await fetchWorkerBookings(
        { status: statusFilter || undefined },
        isAdmin
      );

      setBookings(data || []);
    } catch (err) {
      console.log("❌ Worker bookings fetch failed:", err.message);
    } finally {
      setDataLoading(false);
    }
  }, [statusFilter, isAdmin]); // ✅ Fixed: Removed unnecessary 'roleName' dependency

  const loadWorkers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await fetchWorkers();
      setWorkers(data || []);
    } catch (err) {
      console.log("❌ Workers list fetch failed:", err.message);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!authLoading && profile) {
      loadBookings();
    }
  }, [loadBookings, profile, authLoading]);

  useEffect(() => {
    if (!authLoading && profile && isAdmin) {
      loadWorkers();
    }
  }, [loadWorkers, profile, isAdmin, authLoading]);

  async function handleCreateBooking(e) {
    e.preventDefault();
    if (!description || !preferredDate || !preferredTime) {
      alert("Please fill all booking details");
      return;
    }
    try {
      setSubmitting(true);
      await createWorkerBooking({
        service_category: serviceCategory,
        description,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
      });
      setDescription(""); setPreferredDate(""); setPreferredTime("");
      await loadBookings();
      alert("Booking created successfully ✅");
    } catch (err) { alert(err.message); } finally { setSubmitting(false); }
  }

  async function handleWorkerStatusUpdate(bookingId, status) {
    try {
      await updateWorkerBookingStatus(bookingId, status);
      await loadBookings();
      alert("Status updated ✅");
    } catch (err) { alert(err.message); }
  }

  async function handleAdminAssignWorker(bookingId) {
    const workerId = selectedWorker[bookingId];
    if (!workerId) { alert("Select a worker first"); return; }
    try {
      await assignWorkerToBooking(bookingId, workerId);
      await loadBookings();
      alert("Worker assigned ✅");
    } catch (err) { alert(err.message); }
  }

  if (authLoading || !profile) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Verifying session, please wait...</p>
      </div>
    );
  }

  return (
    <div className="worker-services-container" style={{ padding: "20px" }}>
      <h2>Worker Services</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={loadBookings}>Refresh</button>
      </div>

      {isResident && (
        <div style={{ background: "#fff", padding: 16, borderRadius: 8, marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3>Create a Booking</h3>
          <form onSubmit={handleCreateBooking}>
             <select value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)}>
                <option value="PLUMBER">Plumber</option>
                <option value="ELECTRICIAN">Electrician</option>
                <option value="CLEANER">Cleaner</option>
                <option value="CABLE_OPERATOR">Cable Operator</option>
              </select>
              <textarea 
                rows={3} value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe issue..." style={{ width: "100%", margin: "10px 0", padding: "8px" }} 
              />
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <input 
                  type="date" 
                  min={new Date().toISOString().split("T")[0]} 
                  value={preferredDate} 
                  onChange={(e) => setPreferredDate(e.target.value)} 
                />
                <input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
              </div>
              <button className="btn primary" type="submit" disabled={submitting}>Create Booking</button>
          </form>
        </div>
      )}

      <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3>Bookings</h3>
        {dataLoading ? <p>Loading data...</p> : (
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f3f3", textAlign: "left" }}>
                <th>Category</th><th>Description</th><th>Status</th><th>Worker</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const bookingStatus = (b.status || "").toUpperCase().trim();

                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td>{b.service_category}</td>
                    <td>{b.description}</td>
                    <td><strong className={`status-${bookingStatus.toLowerCase()}`}>{b.status}</strong></td>
                    <td>{b.worker_id || "-"}</td>
                    <td>
                      {isAdmin && bookingStatus === "REQUESTED" && (
                        <div style={{ display: "flex", gap: 5 }}>
                          <select 
                            value={selectedWorker[b.id] || ""}
                            onChange={(e) => setSelectedWorker(prev => ({ ...prev, [b.id]: e.target.value }))}
                          >
                            <option value="">Select Worker</option>
                            {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                          </select>
                          <button onClick={() => handleAdminAssignWorker(b.id)}>Assign</button>
                        </div>
                      )}

                      {isWorker && bookingStatus === "ASSIGNED" && (
                          <button onClick={() => handleWorkerStatusUpdate(b.id, "IN_PROGRESS")}>Start Work</button>
                      )}
                      
                      {isWorker && bookingStatus === "IN_PROGRESS" && (
                          <button onClick={() => handleWorkerStatusUpdate(b.id, "COMPLETED")}>Mark Completed</button>
                      )}

                      {!isAdmin && !isWorker && bookingStatus === "REQUESTED" && (
                        <small style={{ color: "gray" }}>Waiting for assignment</small>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}