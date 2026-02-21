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
import "./complaints.css";

export default function ComplaintsPage() {
  const { profile } = useAuth();
  
  const roleName = profile?.roles?.name || profile?.role || null;
  const isAdmin = roleName === "ADMIN";
  const isWorker = roleName === "WORKER";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("LOW");
  const [formLoading, setFormLoading] = useState(false);
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
        console.log("❌ workers fetch failed:", err.message);
      }
    }
    loadWorkersIfAdmin();
  }, [isAdmin]);

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

  async function handleCreateComplaint(e) {
    e.preventDefault();
    if (!category || !description) {
      setError("Please fill all fields");
      return;
    }
    setFormLoading(true);
    try {
      await createComplaint({ category, description, priority });
      setCategory("");
      setDescription("");
      setPriority("LOW");
      await loadComplaints();
    } catch (err) {
      setError(err.message || "Failed to create");
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="complaints-page">
      <div className="page-header">
        <h2>Complaints ({roleName})</h2>
        <button className="btn" onClick={loadComplaints}>Refresh</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <h3>Create New Complaint</h3>
        <form className="complaint-form" onSubmit={handleCreateComplaint}>
          <div className="form-row">
            <div className="form-field">
              <label>Category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <button className="btn primary" type="submit" disabled={formLoading}>
            {formLoading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Filters</h3>
        <div className="filters" style={{ display: "flex", gap: "20px" }}>
          <div className="form-field">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
          <div className="form-field">
            <label>Priority</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Complaint List</h3>
        {loading ? <p>Loading...</p> : (
          <table className="complaints-table">
            <thead>
              <tr>
                {/* ✅ Added "Raised By" and "Description" Headers */}
                <th>Raised By</th>
                <th>Category</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  {/* ✅ Displays full name from the joined 'profiles' object */}
                  <td>{c.profiles?.full_name || c.resident_id}</td>
                  <td>{c.category}</td>
                  <td>{c.description}</td>
                  <td><span className={`badge priority-${c.priority}`}>{c.priority}</span></td>
                  <td><span className={`badge status-${c.status}`}>{c.status}</span></td>
                  <td>
                    {isAdmin && c.status === "NEW" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <select
                          value={selectedWorker[c.id] || ""}
                          onChange={(e) => setSelectedWorker(prev => ({ ...prev, [c.id]: e.target.value }))}
                        >
                          <option value="">Select Worker</option>
                          {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                        </select>
                        <button className="btn" onClick={() => handleAssignWorker(c.id)} disabled={actionLoadingId === c.id}>
                          {actionLoadingId === c.id ? "..." : "Assign"}
                        </button>
                      </div>
                    )}
                    
                    {isAdmin && c.status === "RESOLVED" && (
                      <button className="btn" onClick={() => handleCloseComplaint(c.id)} disabled={actionLoadingId === c.id}>
                        Close
                      </button>
                    )}

                    {isWorker && c.status === "ASSIGNED" && (
                      <button className="btn" onClick={() => handleWorkerStatusUpdate(c.id, "IN_PROGRESS")} disabled={actionLoadingId === c.id}>
                        Start
                      </button>
                    )}
                    {isWorker && c.status === "IN_PROGRESS" && (
                      <button className="btn" onClick={() => handleWorkerStatusUpdate(c.id, "RESOLVED")} disabled={actionLoadingId === c.id}>
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}