export default function ComplaintCard({ 
    complaint, 
    isAdmin, 
    isWorker, 
    workers, 
    selectedWorker, 
    setSelectedWorker, 
    handleAssignWorker, 
    handleWorkerStatusUpdate, 
    handleCloseComplaint, 
    actionLoadingId 
  }) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
        
        {/* 2️⃣ Improved Header with Priority Badge */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-slate-800 leading-tight">
              {complaint.category}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              #{complaint.id.slice(0, 8)}...
            </p>
          </div>
  
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide
            ${
              complaint.priority === "HIGH" || complaint.priority === "CRITICAL"
                ? "bg-red-100 text-red-700"
                : complaint.priority === "MEDIUM"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
            }
          `}>
            {complaint.priority}
          </span>
        </div>
  
        <p className="text-sm text-slate-600 line-clamp-3">
          {complaint.description}
        </p>
  
        {/* 3️⃣ Created Time Display */}
        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 italic">
          Raised on: {new Date(complaint.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
  
        {/* Action Section (Logic from Kanban Board) */}
        <div className="mt-2 pt-3 border-t border-slate-50">
          {isAdmin && complaint.status === "NEW" && (
            <div className="space-y-2">
              <select
                className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedWorker[complaint.id] || ""}
                onChange={(e) => setSelectedWorker(prev => ({ ...prev, [complaint.id]: e.target.value }))}
              >
                <option value="">Select Worker</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
              </select>
              <button 
                className="w-full bg-slate-900 text-white text-xs py-2 rounded-lg font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50"
                onClick={() => handleAssignWorker(complaint.id)} 
                disabled={actionLoadingId === complaint.id}
              >
                {actionLoadingId === complaint.id ? "Assigning..." : "Assign Worker"}
              </button>
            </div>
          )}
          
          {isAdmin && complaint.status === "RESOLVED" && (
            <button 
              className="w-full bg-green-600 text-white text-xs py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
              onClick={() => handleCloseComplaint(complaint.id)} 
              disabled={actionLoadingId === complaint.id}
            >
              Close Complaint
            </button>
          )}
  
          {isWorker && complaint.status === "ASSIGNED" && (
            <button 
              className="w-full bg-indigo-600 text-white text-xs py-2 rounded-lg font-bold hover:bg-indigo-700"
              onClick={() => handleWorkerStatusUpdate(complaint.id, "IN_PROGRESS")} 
              disabled={actionLoadingId === complaint.id}
            >
              Start Working
            </button>
          )}
  
          {isWorker && complaint.status === "IN_PROGRESS" && (
            <button 
              className="w-full bg-green-600 text-white text-xs py-2 rounded-lg font-bold hover:bg-green-700"
              onClick={() => handleWorkerStatusUpdate(complaint.id, "RESOLVED")} 
              disabled={actionLoadingId === complaint.id}
            >
              Mark as Resolved
            </button>
          )}
        </div>
      </div>
    );
  }