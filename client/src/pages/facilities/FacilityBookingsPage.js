import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useLocation } from "react-router-dom"; 
import {
  fetchFacilityBookings,
  fetchMyFacilityBookings,
  updateFacilityBookingStatus,
  cancelFacilityBooking,
  payForFacilityBooking,
  requestFacilityRefund,
} from "../../api/facilities.api";

// ✅ Added Import
import FacilityBookingCard from "../../components/facilities/FacilityBookingCard";

export default function FacilityBookingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const location = useLocation();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";
  const isMyBookingsPage = location.pathname.includes("my-bookings");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = (isAdmin && !isMyBookingsPage)
        ? await fetchFacilityBookings()
        : await fetchMyFacilityBookings();
      
      setBookings(data || []);
    } catch (err) {
      console.log("❌ Facility bookings fetch failed:", err.message);
      alert(err.message);
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
      } else {
        await updateFacilityBookingStatus(id, status);
      }
      alert(`Booking ${status} ✅`);
      await loadBookings();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePayment(id) {
    const method = window.prompt("Enter payment method (e.g., Credit Card, Cash):", "Credit Card");
    if (!method) return;

    try {
      await payForFacilityBooking(id, method);
      alert("Payment successful! Booking Confirmed.");
      await loadBookings();
    } catch (err) {
      alert("Payment failed: " + err.message);
    }
  }

  async function handleRefundRequest(paymentId) {
    const reason = window.prompt("Reason for refund?", "Change of plans");
    if (!reason) return;

    try {
      await requestFacilityRefund(paymentId, reason);
      alert("Refund request submitted! 🟡");
      await loadBookings();
    } catch (err) {
      alert(err.message || "Refund request failed");
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
      
      {/* ✅ Improved Page Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isMyBookingsPage ? "My Facility Bookings" : "Facility Bookings Management"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isMyBookingsPage ? "Manage your amenity reservations" : "Review and approve community reservations"}
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          Refresh
        </button>
      </div>

      {/* ✅ Replaced Table With Cards */}
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
                
                // Passed down mapped actions in case your card expects these exact names
                onCancel={() => handleUpdateStatus(b.id, "CANCELLED")}
                onRefund={() => b.facility_payments ? handleRefundRequest(b.facility_payments.id) : alert("No payment found")}
                onPay={() => handlePayment(b.id)}
                onApprove={() => handleUpdateStatus(b.id, "APPROVED")}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}