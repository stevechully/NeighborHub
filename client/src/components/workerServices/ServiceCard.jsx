export default function ServiceCard({ booking }) {

    const statusColor = {
      REQUESTED: "bg-yellow-100 text-yellow-700",
      ASSIGNED: "bg-blue-100 text-blue-700",
      IN_PROGRESS: "bg-purple-100 text-purple-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700"
    };
  
    return (
      <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
  
        <div className="flex justify-between">
  
          <h3 className="font-semibold">
            {booking.category}
          </h3>
  
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              statusColor[booking.status] || "bg-gray-100"
            }`}
          >
            {booking.status}
          </span>
  
        </div>
  
        <p className="text-sm text-gray-600 mt-2">
          {booking.description}
        </p>
  
        {booking.worker && (
          <div className="text-sm text-gray-500 mt-2">
            Worker: {booking.worker.name || booking.worker}
          </div>
        )}
  
      </div>
    );
  }