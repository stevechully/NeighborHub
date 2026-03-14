import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useLocation } from "react-router-dom"; 
import { fetchFacilityBookings, fetchMyFacilityBookings, updateFacilityBookingStatus, cancelFacilityBooking, requestFacilityRefund } from "../../api/facilities.api";
import FacilityBookingCard from "../../components/facilities/FacilityBookingCard";
import { usePayment } from "../../components/payments/PaymentContext"; 

export default function FacilityBookingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const location = useLocation();
  const { openPayment } = usePayment();

  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isAdmin = roleName === "ADMIN";
  const isMyBookingsPage = location.pathname.includes("my-bookings");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ Premium Toast State
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = (isAdmin && !isMyBookingsPage) ? await fetchFacilityBookings() : await fetchMyFacilityBookings();
      setBookings(data || []);
    } catch (err) {
      console.log("❌ Facility bookings fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isMyBookingsPage]); 

  useEffect(() => {
    if (!authLoading && profile) {
      loadBookings();
    }
  }, [authLoading, profile, loadBookings]);

  async function handleUpdateStatus(id, status) {
    try {
      if (status === "CANCELLED") {
        await cancelFacilityBooking(id);
        showToast("Booking cancelled successfully.");
      } else {
        await updateFacilityBookingStatus(id, status);
        showToast(`Booking marked as ${status} ✅`);
      }
      loadBookings();
    } catch (err) {
      showToast("❌ " + err.message);
    }
  }

  function handlePayment(booking) {
    openPayment({
      module: "FACILITY",
      referenceId: booking.id,
      amount: booking.facilities.fee, 
      itemName: booking.facilities.name,
      onSuccess: () => {
        showToast("Payment successful! ✅");
        loadBookings(); 
      }
    });
  }

  async function handleRefundRequest(paymentId) {
    const reason = window.prompt("Reason for refund?", "Change of plans");
    if (!reason) return;

    try {
      await requestFacilityRefund(paymentId, reason);
      showToast("Refund request submitted! 🟡");
      await loadBookings();
    } catch (err) {
      showToast("❌ " + (err.message || "Refund request failed"));
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
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isMyBookingsPage ? "My Facility Bookings" : "Facility Bookings Management"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isMyBookingsPage ? "Manage your amenity reservations" : "Review and approve community reservations"}
          </p>
        </div>
        <button onClick={loadBookings} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          Refresh
        </button>
      </div>

      <div>
        {loading ? (
          <p className="text-slate-500 py-10 text-center">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No bookings found.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b) => (
              <FacilityBookingCard
                key={b.id}
                booking={b}
                isAdmin={isAdmin}
                isMyBookingsPage={isMyBookingsPage}
                onCancel={() => handleUpdateStatus(b.id, "CANCELLED")}
                onRefund={() => b.facility_payments ? handleRefundRequest(b.facility_payments.id) : showToast("❌ No payment found")}
                onPay={() => handlePayment(b)}
                onApprove={() => handleUpdateStatus(b.id, "APPROVED")}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ Premium Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium flex items-center gap-3 transition-all z-50 animate-bounce-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}