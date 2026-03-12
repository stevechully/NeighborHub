import { Receipt } from "lucide-react";

export default function PaymentCard({
  payment,
  isAdmin,
  navigate,
  handleApproveRefund
}) {

  const refundStatus = payment.refund_status || "NONE";

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col gap-3">

      {/* Top Section */}
      <div className="flex justify-between">

        <div>
          <p className="text-sm text-gray-500">
            Payment Method
          </p>

          <p className="font-semibold">
            {payment.payment_method}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">
            Amount
          </p>

          <p className="font-semibold text-indigo-600">
            ₹{payment.amount_paid}
          </p>
        </div>

      </div>

      {/* Transaction Reference */}

      <div className="text-xs text-gray-500 font-mono">
        {payment.transaction_ref}
      </div>

      {/* Refund Status */}

      <div>

        {refundStatus === "REQUESTED" && (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
            Refund Requested
          </span>
        )}

        {refundStatus === "REFUNDED" && (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
            Refunded
          </span>
        )}

        {refundStatus === "NONE" && (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
            No Refund
          </span>
        )}

      </div>

      {/* Actions */}

      <div className="flex gap-2 flex-wrap">

        <button
          onClick={() =>
            navigate(`/marketplace/payments/${payment.id}/receipt`)
          }
          className="flex items-center gap-1 border px-3 py-1 rounded-lg"
        >
          <Receipt size={14} />
          Receipt
        </button>

        {isAdmin && refundStatus === "REQUESTED" && (
          <button
            onClick={() => handleApproveRefund(payment.id)}
            className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
          >
            Approve Refund
          </button>
        )}

      </div>

    </div>
  );
}