import { useCallback, useEffect, useState } from "react";
import {
  fetchComplaints,
  createComplaint,
  assignWorkerToComplaint,
  updateComplaintStatus,
  closeComplaint,
} from "../../api/complaints.api";
import { fetchWorkers } from "../../api/admin.api";
import { useAuth } from "../../auth/AuthContext";

// Component Imports
import ComplaintCard from "../../components/complaints/ComplaintCard";
import RaiseComplaintModal from "../../components/complaints/RaiseComplaintModal";

export default function ComplaintsPage() {
  const { profile } = useAuth();
  
  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || "USER";
  const isAdmin = roleName === "ADMIN";
  const isWorker = roleName === "WORKER";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const data = await fetchComplaints(params);
      setComplaints(data);
    } catch (err) {
      setError(err.message || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  useEffect(() => {
    async function loadWorkersIfAdmin() {
      if (!isAdmin) return;
      try {
        const data = await fetchWorkers();
        setWorkers(data);
      } catch (err) {
        console.log("❌ Workers fetch failed:", err.message);
      }
    }
    loadWorkersIfAdmin();
  }, [isAdmin]);

  // Handler: Admin assigns worker
  async function handleAssignWorker(complaintId) {
    const worker_id = selectedWorker[complaintId];
    if (!worker_id) {
      setError("Please select a worker before assigning");
      return;
    }
    setActionLoadingId(complaintId);
    try {
      await assignWorkerToComplaint(complaintId, worker_id);
      await loadComplaints();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handler: Worker updates progress
  async function handleWorkerStatusUpdate(complaintId, nextStatus) {
    setActionLoadingId(complaintId);
    try {
      await updateComplaintStatus(complaintId, nextStatus);
      await loadComplaints();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handler: Admin closes complaint
  async function handleCloseComplaint(complaintId) {
    setActionLoadingId(complaintId);
    try {
      await closeComplaint(complaintId);
      await loadComplaints();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handler: Resident raises new complaint
  async function handleCreateComplaint(data) {
    const cat = data?.category;
    const desc = data?.description;
    const pri = data?.priority || "LOW";

    if (!cat || !desc) {
      setError("Please fill all fields");
      return;
    }

    try {
      await createComplaint({
        category: cat,
        description: desc,
        priority: pri
      });

      setModalOpen(false);
      setError(""); // Clear error on success
      await loadComplaints();
    } catch (err) {
      setError(err.message || "Failed to create complaint");
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      
      {/* 1. Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            Complaint Board 
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-indigo-100">
              {roleName}
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track and manage community service requests</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={loadComplaints}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            Refresh Board
          </button>
          
          {/* ✅ FIXED: Button hidden for Admins */}
          {!isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95"
            >
              + Raise Complaint
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {/* 2. Advanced Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5 px-0.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight">Status Column</label>
            {(statusFilter || priorityFilter) && (
              <button
                onClick={() => { setStatusFilter(""); setPriorityFilter(""); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline decoration-indigo-200"
              >
                Clear All
              </button>
            )}
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1.5 px-0.5">Priority Level</label>
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* 3. Kanban Board Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium italic">Building the board...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((status) => (
            <div key={status} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 min-h-[600px] flex flex-col">
              
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="font-bold text-slate-700 text-xs tracking-widest uppercase">
                  {status.replace("_", " ")}
                </h3>
                <span className="bg-white text-slate-500 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                  {complaints.filter((c) => c.status === status).length}
                </span>
              </div>

              <div className="space-y-4 flex-1">
                {complaints
                  .filter((c) => c.status === status)
                  .map((c) => (
                    <ComplaintCard
                      key={c.id}
                      complaint={c}
                      isAdmin={isAdmin}
                      isWorker={isWorker}
                      workers={workers}
                      selectedWorker={selectedWorker}
                      setSelectedWorker={setSelectedWorker}
                      handleAssignWorker={handleAssignWorker}
                      handleWorkerStatusUpdate={handleWorkerStatusUpdate}
                      handleCloseComplaint={handleCloseComplaint}
                      actionLoadingId={actionLoadingId}
                    />
                  ))}
                
                {complaints.filter((c) => c.status === status).length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[11px] font-medium italic bg-white/30 px-4 text-center">
                    No active {status.toLowerCase().replace("_", " ")} requests
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Hidden Components */}
      <RaiseComplaintModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateComplaint}
      />
    </div>
  );
}