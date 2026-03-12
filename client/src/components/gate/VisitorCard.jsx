export default function VisitorCard({ visitor }) {
    const entry = new Date(visitor.entry_time);
    const exit = visitor.exit_time ? new Date(visitor.exit_time) : null;
  
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
  
        <h3 className="font-semibold text-lg text-slate-800">
          {visitor.visitor_name}
        </h3>
  
        <p className="text-sm text-slate-600 mt-1">
          Purpose: <span className="font-medium">{visitor.purpose}</span>
        </p>
  
        {/* ✅ FIXED: Nested profile mapping */}
        <div className="text-sm text-slate-500 mt-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
          Resident: <b className="text-slate-700">{visitor.profiles?.full_name || "Unknown"}</b>
        </div>
  
        <div className="text-xs text-slate-500 mt-3 font-medium">
          Entry: {entry.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
  
        {exit ? (
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Exit: {exit.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        ) : (
          <div className="text-xs text-amber-600 mt-1 font-bold tracking-wide uppercase">
            Currently Inside
          </div>
        )}
  
      </div>
    );
  }