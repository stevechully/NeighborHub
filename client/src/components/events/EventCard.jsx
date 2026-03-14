export default function EventCard({ event, isAdmin, onRegister, onDelete }) {
  const date = new Date(event.event_date);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
      
      <div>
        <h3 className="font-semibold text-lg text-slate-800">
          {event.title}
        </h3>
        
        <p className="text-sm text-slate-500 mt-1">
          {event.description}
        </p>

        <div className="mt-4 space-y-1 text-sm text-slate-600 font-medium">
          <div>📅 {date.toLocaleDateString()}</div>
          <div>⏰ {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>

        {event.fee > 0 ? (
          <div className="mt-3 inline-block bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg text-sm">
            ₹{event.fee}
          </div>
        ) : (
          <div className="mt-3 inline-block bg-green-50 text-green-700 font-bold px-3 py-1 rounded-lg text-sm">
            Free Event
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        {/* ✅ Now properly triggers the modal wrapper function */}
        <button
          onClick={onRegister}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Register
        </button>

        {/* ✅ Admin Delete Button now appears properly! */}
        {isAdmin && (
          <button
            onClick={onDelete}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            Delete
          </button>
        )}
      </div>

    </div>
  );
}