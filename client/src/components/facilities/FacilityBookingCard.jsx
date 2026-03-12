export default function FacilityBookingCard({
    booking,
    onCancel,
    onRefund
  }) {
  
    const statusColor = {
      CONFIRMED: "bg-green-100 text-green-700",
      APPROVED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-red-100 text-red-700",
      PENDING: "bg-yellow-100 text-yellow-700"
    };
  
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
  
    return (
      <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
  
        <div className="flex justify-between items-start">
  
          <div>
  
            <h3 className="font-semibold text-lg">
              {booking.facility_name || booking.facility}
            </h3>
  
            <div className="text-sm text-gray-500 mt-1">
              {start.toLocaleDateString()}
            </div>
  
          </div>
  
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              statusColor[booking.status] || "bg-gray-100"
            }`}
          >
            {booking.status}
          </span>
  
        </div>
  
        <div className="mt-3 text-sm text-gray-600">
  
          <div>
            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" → "}
            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
  
        </div>
  
        <div className="flex gap-2 mt-4">
  
          {booking.status !== "CANCELLED" && (
            <>
              <button
                onClick={() => onRefund(booking.id)}
                className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm"
              >
                Request Refund
              </button>
  
              <button
                onClick={() => onCancel(booking.id)}
                className="border border-gray-300 px-3 py-1 rounded-lg text-sm"
              >
                Cancel
              </button>
            </>
          )}
  
        </div>
  
      </div>
    );
  }