export default function ParcelCard({ parcel }) {
    const received = new Date(parcel.received_at);
  
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
  
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-slate-800 leading-tight">
            {parcel.courier_name}
          </h3>
  
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border
            ${parcel.status === "RECEIVED" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}
          `}>
            {parcel.status}
          </span>
        </div>
  
        <div className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded inline-block w-fit border border-slate-100 mb-3">
          TRK: {parcel.tracking_number || "N/A"}
        </div>
  
        {/* ✅ FIXED: Nested profile mapping */}
        <div className="text-sm text-slate-500 mt-auto pt-3 border-t border-slate-100">
          Resident: <b className="text-slate-700">{parcel.profiles?.full_name || "Unknown"}</b>
        </div>
  
        <div className="text-[10px] text-slate-400 mt-1 font-medium italic">
          Logged: {received.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
  
      </div>
    );
  }