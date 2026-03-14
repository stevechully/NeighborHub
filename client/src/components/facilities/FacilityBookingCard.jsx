import { Calendar, Clock, CreditCard, AlertCircle } from "lucide-react";

export default function FacilityBookingCard({
  booking,
  isAdmin,
  isMyBookingsPage,
  onCancel,
  onRefund,
  onPay,
  onApprove
}) {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  // Status Booleans
  const isReserved = booking.status === "RESERVED";
  const isCancelled = booking.status === "CANCELLED";
  const isExpired = booking.status === "EXPIRED";
  
  // Payment Safety Checks
  const payment = booking.facility_payments;
  const hasPaid = payment && payment.id ? true : false; 
  
  // Only allow refunds if it is CANCELLED and they actually paid for it.
  const canRefund = isCancelled && hasPaid && payment.refund_status === "NONE";

  // Dynamic Status Badge Colors
  const getStatusBadge = () => {
    switch (booking.status) {
      case "CONFIRMED": return "bg-green-100 text-green-700";
      case "RESERVED": return "bg-blue-100 text-blue-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "EXPIRED": return "bg-slate-200 text-slate-600";
      case "APPROVED": return "bg-emerald-100 text-emerald-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between 
      ${isCancelled || isExpired ? "opacity-75 border-slate-200 bg-slate-50" : "hover:shadow-md border-slate-200"}
    `}>
      
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className={`font-bold text-lg leading-tight ${isCancelled || isExpired ? "text-slate-600 line-through" : "text-slate-800"}`}>
            {booking.facilities?.name || booking.facility_name || "Unknown Facility"}
          </h3>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${getStatusBadge()}`}>
            {booking.status}
          </span>
        </div>

        {/* Date & Time */}
        <div className="space-y-1.5 mb-5">
          <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} 
            <span className="text-slate-300">→</span> 
            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Refund Status display */}
        {hasPaid && payment.refund_status !== "NONE" && (
          <div className="mb-4">
            <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 w-max
              ${payment.refund_status === 'REQUESTED' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}
            `}>
              {payment.refund_status === 'REQUESTED' ? 'Refund Pending 🟡' : 'Refund Processed 🟢'}
            </span>
          </div>
        )}
      </div>

      {/* --- Action Buttons --- */}
      <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex gap-2 justify-end">
          
          {/* Pending Payment -> Pay Now */}
          {isReserved && onPay && (
            <button onClick={() => onPay(booking)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
              <CreditCard size={16} /> Pay Now
            </button>
          )}

          {/* Cancelled Paid Booking -> Request Refund */}
          {canRefund && onRefund && (
            <button onClick={() => onRefund(payment.id)} className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
              <AlertCircle size={16} /> Request Refund
            </button>
          )}

          {/* Active Booking -> Cancel */}
          {!isCancelled && !isExpired && onCancel && (
            <button onClick={() => onCancel(booking.id)} className="border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              Cancel
            </button>
          )}

          {/* Admin Approvals */}
          {isAdmin && !isMyBookingsPage && booking.status === "PENDING" && onApprove && (
            <button onClick={() => onApprove(booking.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
              Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}