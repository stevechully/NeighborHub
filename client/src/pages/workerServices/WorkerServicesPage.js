import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  createWorkerBooking,
  fetchWorkerBookings,
  fetchMyWorkerBookings, // ✅ Added for safe resident fetching
  updateWorkerBookingStatus,
  assignWorkerToBooking,
  payForWorkerService,
  requestWorkerRefund, // ✅ Added for refund handling
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
  const [paymentMethod, setPaymentMethod] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Role Detection
  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isAdmin = roleName === "ADMIN";
  const isWorker = roleName === "WORKER";
  const isResident = roleName === "RESIDENT";

  const statusOptions = useMemo(
    () => ["REQUESTED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "PAID", "CANCELLED"],
    []
  );

  const paymentOptions = ["UPI", "CARD", "CASH", "NET_BANKING"];

  const loadBookings = useCallback(async () => {
    try {
      setDataLoading(true);
      // ✅ Residents use the new manual merge API; Admins use the global one
      const data = isResident 
        ? await fetchMyWorkerBookings() 
        : await fetchWorkerBookings({ status: statusFilter || undefined }, isAdmin);
      
      setBookings(data || []);
    } catch (err) {
      console.log("❌ Worker bookings fetch failed:", err.message);
    } finally {
      setDataLoading(false);
    }
  }, [statusFilter, isAdmin, isResident]);

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

  // --- Handlers ---

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
    setActionLoadingId(bookingId);
    try {
      await updateWorkerBookingStatus(bookingId, status);
      await loadBookings();
      alert(`Service marked as ${status} ✅`);
    } catch (err) { alert(err.message); } finally { setActionLoadingId(null); }
  }

  async function handleAdminAssignWorker(bookingId) {
    const workerId = selectedWorker[bookingId];
    if (!workerId) { alert("Select a worker first"); return; }
    setActionLoadingId(bookingId);
    try {
      await assignWorkerToBooking(bookingId, workerId);
      await loadBookings();
      alert("Worker assigned ✅");
    } catch (err) { alert(err.message); } finally { setActionLoadingId(null); }
  }

  async function handlePayment(bookingId) {
    const method = paymentMethod[bookingId] || "UPI";
    setActionLoadingId(bookingId);
    try {
      const res = await payForWorkerService(bookingId, { payment_method: method });
      alert(`Payment Successful! ✅ Ref: ${res.transaction_ref}`);
      await loadBookings();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  // ✅ NEW: Handle Refund Request
  async function handleRefundRequest(paymentId) {
    const reason = window.prompt("Reason for refund?", "Service not required");
    if (!reason) return;

    setActionLoadingId(paymentId);
    try {
      await requestWorkerRefund(paymentId, reason);
      alert("Refund request submitted! 🟡");
      await loadBookings();
    } catch (err) {
      alert(err.message || "Refund request failed");
    } finally {
      setActionLoadingId(null);
    }
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
                    <td>
                        <strong className={`status-${bookingStatus.toLowerCase()}`}>{b.status}</strong>
                        {/* ✅ Refund Status Display */}
                        {b.worker_payments?.refund_status === "REQUESTED" && (
                            <div style={{ color: "#f39c12", fontSize: "0.8rem" }}>🟡 Refund Requested</div>
                        )}
                        {b.worker_payments?.refund_status === "REFUNDED" && (
                            <div style={{ color: "#28a745", fontSize: "0.8rem" }}>🟢 Refunded</div>
                        )}
                    </td>
                    <td>{b.worker_id || b.workers?.full_name || "-"}</td>
                    <td>
                      {/* ADMIN: Assign Worker */}
                      {isAdmin && bookingStatus === "REQUESTED" && (
                        <div style={{ display: "flex", gap: 5 }}>
                          <select 
                            value={selectedWorker[b.id] || ""}
                            onChange={(e) => setSelectedWorker(prev => ({ ...prev, [b.id]: e.target.value }))}
                          >
                            <option value="">Select Worker</option>
                            {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                          </select>
                          <button onClick={() => handleAdminAssignWorker(b.id)} disabled={actionLoadingId === b.id}>
                            {actionLoadingId === b.id ? "..." : "Assign"}
                          </button>
                        </div>
                      )}

                      {/* WORKER: Progression */}
                      {isWorker && bookingStatus === "ASSIGNED" && (
                        <button onClick={() => handleWorkerStatusUpdate(b.id, "IN_PROGRESS")} disabled={actionLoadingId === b.id}>
                          {actionLoadingId === b.id ? "..." : "Start Work"}
                        </button>
                      )}
                      {isWorker && bookingStatus === "IN_PROGRESS" && (
                        <button onClick={() => handleWorkerStatusUpdate(b.id, "COMPLETED")} disabled={actionLoadingId === b.id}>
                          {actionLoadingId === b.id ? "..." : "Mark Completed"}
                        </button>
                      )}

                      {/* RESIDENT: Payment & Refund */}
                      {isResident && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {bookingStatus === "COMPLETED" && (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <select 
                                value={paymentMethod[b.id] || "UPI"} 
                                onChange={(e) => setPaymentMethod(prev => ({ ...prev, [b.id]: e.target.value }))}
                              >
                                {paymentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                              <button 
                                className="btn success" 
                                style={{ background: "#28a745", color: "white" }}
                                onClick={() => handlePayment(b.id)}
                                disabled={actionLoadingId === b.id}
                              >
                                {actionLoadingId === b.id ? "Processing..." : `Pay ₹${b.amount || 500}`}
                              </button>
                            </div>
                          )}

                          {/* ✅ NEW: Refund Button logic */}
                          {bookingStatus === "PAID" && b.worker_payments?.refund_status === "NONE" && (
                            <button
                              style={{ background: "#f39c12", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                              onClick={() => handleRefundRequest(b.worker_payments.id)}
                              disabled={actionLoadingId === b.worker_payments.id}
                            >
                              {actionLoadingId === b.worker_payments.id ? "Submitting..." : "Request Refund"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Status Labels */}
                      {isResident && bookingStatus === "REQUESTED" && (
                        <small style={{ color: "gray" }}>Waiting for assignment</small>
                      )}
                      {bookingStatus === "PAID" && (
                        <span style={{ color: "#28a745", fontWeight: "bold" }}>Payment Received ✅</span>
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