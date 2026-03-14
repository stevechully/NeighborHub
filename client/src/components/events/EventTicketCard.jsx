import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function EventTicketCard({ event, onCancel, onRequestRefund }) {
  const date = new Date(event.event_date);
  const isCancelled = event.status === "CANCELLED";
  const payment = event.event_payments;
  const isPaid = event.payment_status === "PAID" && payment;

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm flex items-center justify-between transition-all
      ${isCancelled ? "border-slate-200 bg-slate-50 opacity-75" : "border-indigo-100 hover:shadow-md"}
    `}>
      
      <div className="flex items-center gap-5">
        {/* Date Calendar Icon */}
        <div className={`rounded-xl p-3 text-center min-w-[70px]
          ${isCancelled ? "bg-slate-200 text-slate-500" : "bg-indigo-600 text-white shadow-sm"}
        `}>
          <div className="text-xl font-black leading-none">{date.getDate()}</div>
          <div className="text-xs font-bold uppercase tracking-widest mt-1">
            {date.toLocaleString("default", { month: "short" })}
          </div>
        </div>

        {/* Details */}
        <div>
          <h3 className={`font-bold text-lg ${isCancelled ? "text-slate-600 line-through" : "text-slate-800"}`}>
            {event.title}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            📍 {event.location}
          </p>

          {/* Refund Status Badges */}
          {isCancelled && isPaid && (
            <div className="mt-2">
              {payment.refund_status === "NONE" && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">Ticket Cancelled</span>
              )}
              {payment.refund_status === "REQUESTED" && (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md flex items-center gap-1 w-max">
                  <Clock size={12}/> Refund Pending
                </span>
              )}
              {payment.refund_status === "REFUNDED" && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md flex items-center gap-1 w-max">
                  <CheckCircle size={12}/> Refund Processed
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-2">
        {/* Active Ticket -> Can Cancel */}
        {!isCancelled && (
          <button
            onClick={() => onCancel(event.registration_id)}
            className="text-red-500 hover:bg-red-50 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Cancel Ticket
          </button>
        )}

        {/* Cancelled + Paid -> Can Request Refund */}
        {isCancelled && isPaid && payment.refund_status === "NONE" && (
          <button
            onClick={onRequestRefund}
            className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            <AlertCircle size={16} /> Request Refund
          </button>
        )}
      </div>

    </div>
  );
}