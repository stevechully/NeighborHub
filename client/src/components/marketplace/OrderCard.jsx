import React from "react";
import { Receipt, CreditCard, AlertCircle } from "lucide-react";

export default function OrderCard({
  order,
  isResident,
  isAdmin,
  handlePayOrder, 
  handleRefundRequest,
  navigate
}) {
  const isPaid = order.payment_status === "PAID";
  const isRefunded = order.payment_status === "REFUNDED";
  const isPending = order.payment_status === "PENDING";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      
      <div>
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-bold text-slate-800 leading-tight">
            {order.marketplace_products?.name || "Unknown Product"}
          </h4>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md
            ${isPaid ? "bg-green-100 text-green-700" : 
              isRefunded ? "bg-red-100 text-red-700" : 
              "bg-amber-100 text-amber-700"}
          `}>
            {order.payment_status}
          </span>
        </div>

        <div className="space-y-1 mb-4">
          <p className="text-sm text-slate-500">
            Qty: <span className="font-semibold text-slate-700">{order.quantity}</span>
          </p>
          <p className="text-sm text-slate-500">
            Total: <span className="font-bold text-indigo-600">₹{order.marketplace_products?.price * order.quantity}</span>
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-50 space-y-2">
        {/* Resident: Pay Now Button */}
        {isResident && isPending && (
          <button
            onClick={() => handlePayOrder(order)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <CreditCard size={16} /> Pay Now
          </button>
        )}

        {/* Resident: View Receipt (If Paid) */}
        {isResident && isPaid && order.marketplace_payments?.id && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/marketplace/payments/${order.marketplace_payments.id}/receipt`)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Receipt size={16} /> Receipt
            </button>
            
            {/* Refund Button */}
            {order.marketplace_payments?.refund_status === "NONE" && (
              <button
                onClick={() => handleRefundRequest(order.marketplace_payments.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Request Refund"
              >
                <AlertCircle size={20} />
              </button>
            )}
          </div>
        )}

        {/* Admin info */}
        {isAdmin && (
          <p className="text-[10px] text-slate-400 text-center font-medium italic">
            Buyer ID: {order.buyer_id.split("-")[0]}...
          </p>
        )}
      </div>
    </div>
  );
}