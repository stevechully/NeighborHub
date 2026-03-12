import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  createWorkerBooking,
  fetchWorkerBookings,
  fetchMyWorkerBookings,
  updateWorkerBookingStatus,
  assignWorkerToBooking,
  payForWorkerService,
  requestWorkerRefund,
} from "../../api/workerServices.api";
import { fetchWorkers } from "../../api/admin.api";

// ✅ Component Imports
import ServiceCard from "../../components/workerServices/ServiceCard";
import ServiceRequestModal from "../../components/workerServices/ServiceRequestModal";

export default function WorkerServicesPage() {
  const { profile, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // ✅ Add modal state
  const [modalOpen, setModalOpen] = useState(false);
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

  async function handleCreateBooking(e, modalData = null) {
    if (e && e.preventDefault) e.preventDefault();
    
    // Fallback to modalData if the modal passes state up directly
    const category = modalData?.serviceCategory;
    const desc = modalData?.description;
    const prefDate = modalData?.preferredDate;
    const prefTime = modalData?.preferredTime;

    if (!desc || !prefDate || !prefTime) {
      alert("Please fill all booking details");
      return;
    }

    try {
      setSubmitting(true);
      await createWorkerBooking({
        service_category: category,
        description: desc,
        preferred_date: prefDate,
        preferred_time: prefTime,
      });
      
      setModalOpen(false); // Close modal on success
      await loadBookings();
      alert("Booking created successfully ✅");
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setSubmitting(false); 
    }
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
      <div className="p-10 flex justify-center items-center">
        <p className="text-slate-500 font-medium animate-pulse">Verifying session, please wait...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* ✅ Add Request Button & Modern Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Worker Services</h2>
          <p className="text-sm text-slate-500 mt-1">Book plumbers, electricians, and more</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={loadBookings}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            Refresh
          </button>
          
          {isResident && (
            <button
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              + Request Service
            </button>
          )}
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <label className="text-sm font-medium text-slate-600">Filter Status:</label>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-w-[200px]"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ✅ Replace Table With Cards */}
      <div>
        {dataLoading ? (
          <p className="text-slate-500 py-10 text-center">Loading services...</p>
        ) : bookings.length === 0 ? (
          <p className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No service requests found.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b) => (
              <ServiceCard
                key={b.id}
                booking={b}
                
                // Passing down all role flags and data arrays
                isAdmin={isAdmin}
                isWorker={isWorker}
                isResident={isResident}
                workers={workers}
                paymentOptions={paymentOptions}
                
                // Passing down all local action states
                selectedWorker={selectedWorker}
                setSelectedWorker={setSelectedWorker}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                actionLoadingId={actionLoadingId}
                
                // Passing down all action handlers
                handleAdminAssignWorker={handleAdminAssignWorker}
                handleWorkerStatusUpdate={handleWorkerStatusUpdate}
                handlePayment={handlePayment}
                handleRefundRequest={handleRefundRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ Add Modal */}
      <ServiceRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateBooking}
        submitting={submitting}
      />
    </div>
  );
}