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

      {booking.worker_id && (
        <div className="text-xs text-slate-500">
          Worker Assigned
        </div>
      )}

      {/* ADMIN ASSIGN */}
      {isAdmin && booking.status === "REQUESTED" && (
        <div className="flex flex-col gap-2 mt-2">

          <select
            value={selectedWorker[booking.id] || ""}
            onChange={(e) =>
              setSelectedWorker(prev => ({
                ...prev,
                [booking.id]: e.target.value
              }))
            }
            className="border rounded-lg p-2 text-sm"
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
            className="bg-indigo-600 text-white rounded-lg py-2 text-sm"
            disabled={actionLoadingId === booking.id}
          >
            Assign Worker
          </button>

        </div>
      )}

      {/* WORKER ACTIONS */}
      {isWorker && booking.status === "ASSIGNED" && (
        <button
          onClick={() => handleWorkerStatusUpdate(booking.id, "IN_PROGRESS")}
          className="bg-indigo-600 text-white rounded-lg py-2 text-sm mt-2"
        >
          Start Work
        </button>
      )}

      {isWorker && booking.status === "IN_PROGRESS" && (
        <button
          onClick={() => handleWorkerStatusUpdate(booking.id, "COMPLETED")}
          className="bg-green-600 text-white rounded-lg py-2 text-sm mt-2"
        >
          Mark Completed
        </button>
      )}

      {/* RESIDENT PAYMENT */}
      {isResident && booking.status === "COMPLETED" && (
        <div className="flex gap-2 mt-2">

          <select
            value={paymentMethod[booking.id] || "UPI"}
            onChange={(e) =>
              setPaymentMethod(prev => ({
                ...prev,
                [booking.id]: e.target.value
              }))
            }
            className="border rounded-lg p-2 text-sm"
          >
            {paymentOptions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <button
            onClick={() => handlePayment(booking.id)}
            className="bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm"
          >
            Pay
          </button>

        </div>
      )}

      {/* RESIDENT REFUND */}
      {isResident && booking.worker_payments?.refund_status === "NONE" && booking.status === "PAID" && (
        <button
          onClick={() => handleRefundRequest(booking.worker_payments.id)}
          className="bg-yellow-500 text-white rounded-lg py-2 text-sm mt-2"
        >
          Request Refund
        </button>
      )}

    </div>
  );
}