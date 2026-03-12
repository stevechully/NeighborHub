import { Receipt } from "lucide-react";

export default function OrderCard({
  order,
  isResident,
  isAdmin,
  paymentMethods,
  paymentMethodMap,
  setPaymentMethodMap,
  handlePayOrder,
  payingOrderId,
  handleRefundRequest,
  navigate
}) {

  const hasPayment = !!order.marketplace_payments?.id;

  const totalCost =
    order.marketplace_products?.price
      ? order.marketplace_products.price * order.quantity
      : "—";

  const paymentStatus =
    order.payment_status || "UNPAID";

  const refundStatus =
    order.marketplace_payments?.refund_status || "NONE";

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col gap-3">

      {/* Product Info */}
      <div className="flex justify-between">

        <div>
          <h3 className="font-semibold">
            {order.marketplace_products?.name || "Product"}
          </h3>

          <p className="text-sm text-gray-500">
            Qty: {order.quantity}
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold text-indigo-600">
            ₹{totalCost}
          </p>
        </div>

      </div>

      {/* Status Section */}

      <div className="flex gap-3 text-xs">

        <span className={`px-2 py-1 rounded-full
          ${paymentStatus === "PAID"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"}
        `}>
          {paymentStatus}
        </span>

        {refundStatus === "REQUESTED" && (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            Refund Requested
          </span>
        )}

        {refundStatus === "REFUNDED" && (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
            Refunded
          </span>
        )}

      </div>

      {/* Actions */}

      <div className="flex gap-2 items-center flex-wrap">

        {/* Payment */}

        {isResident && !hasPayment && paymentStatus !== "PAID" && (
          <>
            <select
              className="border rounded-lg px-2 py-1"
              value={paymentMethodMap[order.id] || "MOCK_UPI"}
              onChange={(e) =>
                setPaymentMethodMap((prev) => ({
                  ...prev,
                  [order.id]: e.target.value
                }))
              }
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </select>

            <button
              onClick={() => handlePayOrder(order.id)}
              className="bg-indigo-600 text-white px-3 py-1 rounded-lg"
            >
              {payingOrderId === order.id ? "Paying..." : "Pay Now"}
            </button>
          </>
        )}

        {/* Receipt */}

        {hasPayment && (
          <button
            onClick={() =>
              navigate(`/marketplace/payments/${order.marketplace_payments.id}/receipt`)
            }
            className="flex items-center gap-1 border px-3 py-1 rounded-lg"
          >
            <Receipt size={14} />
            Receipt
          </button>
        )}

        {/* Refund */}

        {isResident &&
          hasPayment &&
          refundStatus === "NONE" &&
          paymentStatus !== "REFUNDED" && (
            <button
              onClick={() =>
                handleRefundRequest(order.marketplace_payments.id)
              }
              className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
            >
              Request Refund
            </button>
          )}

      </div>

    </div>
  );
}