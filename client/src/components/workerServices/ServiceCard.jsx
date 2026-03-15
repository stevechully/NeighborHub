export default function ServiceCard({
  booking,
  isAdmin,
  isWorker,
  isResident,
  workers,
  paymentOptions,
  selectedWorker,
  setSelectedWorker,
  paymentMethod,
  setPaymentMethod,
  actionLoadingId,
  handleAdminAssignWorker,
  handleWorkerStatusUpdate,
  handlePayment,
  handleRefundRequest
}) {

  const statusColor = {
    REQUESTED: "bg-yellow-100 text-yellow-700",
    ASSIGNED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-purple-100 text-purple-700",
    COMPLETED: "bg-green-100 text-green-700",
    PAID: "bg-gray-200 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700"
  };

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">

      {/* Header */}
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-slate-800">
          {booking.service_category}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      <p className="text-sm text-slate-600">
        {booking.description}
      </p>

      {/* ✅ ADDED: Admin-only User Badge */}
      {isAdmin && booking.resident && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
          Raised by: 
          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
            {booking.resident.full_name}
          </span>
        </div>
      )}

      {/* Worker Display */}
      {booking.workers?.full_name ? (
        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
          Assigned to: <span className="font-semibold">{booking.workers.full_name}</span>
        </div>
      ) : booking.worker_id && (
        <div className="text-xs text-slate-500 mt-1">
          Worker Assigned
        </div>
      )}

      {/* ADMIN ASSIGN */}
      {isAdmin && booking.status === "REQUESTED" && (
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
          <select
            value={selectedWorker[booking.id] || ""}
            onChange={(e) =>
              setSelectedWorker(prev => ({
                ...prev,
                [booking.id]: e.target.value
              }))
            }
            className="border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Worker</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>
                {w.full_name}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleAdminAssignWorker(booking.id)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-50"
            disabled={actionLoadingId === booking.id}
          >
            {actionLoadingId === booking.id ? "Assigning..." : "Assign Worker"}
          </button>
        </div>
      )}

      {/* WORKER ACTIONS */}
      {isWorker && booking.status === "ASSIGNED" && (
        <button
          onClick={() => handleWorkerStatusUpdate(booking.id, "IN_PROGRESS")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2 text-sm mt-2 transition-colors disabled:opacity-50"
          disabled={actionLoadingId === booking.id}
        >
          Start Work
        </button>
      )}

      {isWorker && booking.status === "IN_PROGRESS" && (
        <button
          onClick={() => handleWorkerStatusUpdate(booking.id, "COMPLETED")}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-2 text-sm mt-2 transition-colors disabled:opacity-50"
          disabled={actionLoadingId === booking.id}
        >
          Mark Completed
        </button>
      )}

      {/* RESIDENT PAYMENT */}
      {isResident && booking.status === "COMPLETED" && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
          <select
            value={paymentMethod[booking.id] || "UPI"}
            onChange={(e) =>
              setPaymentMethod(prev => ({
                ...prev,
                [booking.id]: e.target.value
              }))
            }
            className="border rounded-lg p-2 text-sm flex-1 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {paymentOptions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <button
            onClick={() => handlePayment(booking.id)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
            disabled={actionLoadingId === booking.id}
          >
            Pay
          </button>
        </div>
      )}

      {/* RESIDENT REFUND */}
      {isResident && booking.worker_payments?.refund_status === "NONE" && booking.status === "PAID" && (
        <button
          onClick={() => handleRefundRequest(booking.worker_payments.id)}
          className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-lg py-2 text-sm mt-2 transition-colors disabled:opacity-50"
          disabled={actionLoadingId === booking.id}
        >
          Request Refund
        </button>
      )}

    </div>
  );
}