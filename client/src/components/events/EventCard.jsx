export default function EventCard({ event, onRegister }) {

    const date = new Date(event.event_date);
  
    return (
      <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between">
  
        <div>
  
          <h3 className="font-semibold text-lg">
            {event.title}
          </h3>
  
          <p className="text-sm text-gray-500 mt-1">
            {event.description}
          </p>
  
          <div className="mt-3 text-sm text-gray-600">
  
            <div>
              {date.toLocaleDateString()}
            </div>
  
            <div>
              {date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
  
          </div>
  
          {event.fee > 0 && (
            <div className="mt-2 font-medium text-indigo-600">
              ₹{event.fee}
            </div>
          )}
  
        </div>
  
        <button
          onClick={() => onRegister(event.id)}
          className="mt-4 bg-indigo-600 text-white py-2 rounded-lg"
        >
          Register
        </button>
  
      </div>
    );
  }