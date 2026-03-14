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

// Component Imports
import ServiceCard from "../../components/workerServices/ServiceCard";
import ServiceRequestModal from "../../components/workerServices/ServiceRequestModal";

export default function WorkerServicesPage() {
  const { profile, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState({});
  const [paymentMethod, setPaymentMethod] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // ✅ Toast State
  const [toastMsg, setToastMsg] = useState("");

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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

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

  async function handleCreateBooking(data) {
    try {
      setSubmitting(true);
      await createWorkerBooking({
        service_category: data.serviceCategory,
        description: data.description,
        preferred_date: data.preferredDate,
        preferred_time: data.preferredTime,
      });
      
      setModalOpen(false); 
      await loadBookings();
      showToast("Booking created successfully ✅");
    } catch (err) { 
      throw err; // Throws back to the modal so it can display the inline error
    } finally { 
      setSubmitting(false); 
    }
  }

  async function handleWorkerStatusUpdate(bookingId, status) {
    setActionLoadingId(bookingId);
    try {
      await updateWorkerBookingStatus(bookingId, status);
      await loadBookings();
      showToast(`Service marked as ${status} ✅`);
    } catch (err) { 
      showToast("❌ " + err.message); 
    } finally { 
      setActionLoadingId(null); 
    }
  }

  async function handleAdminAssignWorker(bookingId) {
    const workerId = selectedWorker[bookingId];
    if (!workerId) { 
      showToast("⚠️ Select a worker first"); 
      return; 
    }
    setActionLoadingId(bookingId);
    try {
      await assignWorkerToBooking(bookingId, workerId);
      await loadBookings();
      showToast("Worker assigned ✅");
    } catch (err) { 
      showToast("❌ " + err.message); 
    } finally { 
      setActionLoadingId(null); 
    }
  }

  async function handlePayment(bookingId) {
    const method = paymentMethod[bookingId] || "UPI";
    setActionLoadingId(bookingId);
    try {
      await payForWorkerService(bookingId, { payment_method: method });
      showToast(`Payment Successful! ✅`);
      await loadBookings();
    } catch (err) {
      showToast("❌ " + err.message);
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
      showToast("Refund request submitted! 🟡");
      await loadBookings();
    } catch (err) {
      showToast("❌ " + (err.message || "Refund request failed"));
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
    <div className="max-w-7xl mx-auto p-6 space-y-6 relative">
      
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
                isAdmin={isAdmin}
                isWorker={isWorker}
                isResident={isResident}
                workers={workers}
                paymentOptions={paymentOptions}
                selectedWorker={selectedWorker}
                setSelectedWorker={setSelectedWorker}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                actionLoadingId={actionLoadingId}
                handleAdminAssignWorker={handleAdminAssignWorker}
                handleWorkerStatusUpdate={handleWorkerStatusUpdate}
                handlePayment={handlePayment}
                handleRefundRequest={handleRefundRequest}
              />
            ))}
          </div>
        )}
      </div>

      <ServiceRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateBooking}
        submitting={submitting}
      />

      {/* ✅ Premium Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium flex items-center gap-3 transition-all z-50 animate-bounce-in">
          {toastMsg}
        </div>
      )}

    </div>
  );
}