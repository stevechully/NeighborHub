import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";

export default function ServiceRequestModal({ open, onClose, onSubmit, submitting }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  // ✅ Clear the form & errors every time the modal opens
  useEffect(() => {
    if (open) {
      setCategory("");
      setDescription("");
      setDate("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    
    // ✅ Inline Validation (No more alerts!)
    if (!category || !description || !date) {
      setError("Please fill in all booking details.");
      return;
    }

    setError(""); // Clear previous errors

    // Split the datetime-local string (YYYY-MM-DDTHH:mm) into date and time
    const [preferredDate, preferredTime] = date.split("T");

    try {
      // Await the parent's submit handler so we can catch backend errors
      await onSubmit({ 
        serviceCategory: category, 
        description, 
        preferredDate, 
        preferredTime 
      });
    } catch (err) {
      setError(err.message || "Failed to submit request.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Request Worker Service
        </h2>
        
        <form onSubmit={submit} className="space-y-4">
          
          {/* Inline Error Display */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-sm font-medium">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="">Select a service...</option>
              <option value="PLUMBER">Plumber</option>
              <option value="ELECTRICIAN">Electrician</option>
              <option value="CLEANER">Cleaner</option>
              <option value="CARPENTER">Carpenter</option>
              <option value="CABLE_OPERATOR">Cable Operator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issue Description</label>
            <textarea
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 h-24 outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date & Time</label>
            <input
              type="datetime-local"
              // ✅ CRITICAL FIX: Blocks selecting past dates
              min={new Date().toISOString().slice(0, 16)} 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center min-w-[120px] shadow-sm"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : "Request Service"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}