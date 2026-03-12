export default function EventTicketCard({ event, onCancel }) {

    const date = new Date(event.event_date);
  
    return (
      <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between">
  
        <div className="flex items-center gap-4">
  
          <div className="bg-indigo-600 text-white rounded-lg p-3 text-center">
  
            <div className="text-lg font-bold">
              {date.getDate()}
            </div>
  
            <div className="text-xs">
              {date.toLocaleString("default", { month: "short" })}
            </div>
  
          </div>
  
          <div>
            <h3 className="font-semibold">
              {event.title}
            </h3>
  
            <p className="text-sm text-gray-500">
              {event.location}
            </p>
          </div>
  
        </div>
  
        <button
          onClick={() => onCancel(event.id)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Cancel
        </button>
  
      </div>
    );
  }