import React, { useEffect, useState } from "react";
import { cancelEventRegistration, requestEventRefund } from "../../api/events.api";
import { AlertTriangle, X, Loader2, RefreshCw } from "lucide-react";
import EventTicketCard from "../../components/events/EventTicketCard";
import { apiFetch } from "../../api/client"; 

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const [cancelModalId, setCancelModalId] = useState(null);
  const [refundModalId, setRefundModalId] = useState(null);
  const [refundReason, setRefundReason] = useState("Unable to attend");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/events/my");
      setEvents(res || []);
    } catch (err) {
      console.error("Error fetching my events:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const executeCancel = async () => {
    if (!cancelModalId) return;

    try {
      setIsProcessing(true);
      await cancelEventRegistration(cancelModalId);

      // ✅ FIXED: Instead of filtering it out, we update its status in the UI so it stays visible!
      setEvents((prev) => prev.map(e => e.registration_id === cancelModalId ? { ...e, status: "CANCELLED" } : e));
      showToast("Registration cancelled ✅");
      
      setCancelModalId(null); 
    } catch (err) {
      showToast("❌ " + (err.message || "Cancellation failed"));
      setCancelModalId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeRefund = async () => {
    if (!refundModalId || !refundReason.trim()) return;

    try {
      setIsProcessing(true);
      await requestEventRefund(refundModalId, refundReason);
      
      setEvents((prev) => 
        prev.map((e) => 
          e.event_payments?.id === refundModalId 
            ? { ...e, event_payments: { ...e.event_payments, refund_status: "REQUESTED" } } 
            : e
        )
      );

      showToast("Refund request submitted 🟡");
      setRefundModalId(null); 
      setRefundReason("Unable to attend");

    } catch (err) {
      showToast("❌ " + (err.message || "Refund failed"));
      setRefundModalId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center items-center"><p className="text-slate-500 font-medium animate-pulse">Loading your registered events...</p></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 relative">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">My Tickets</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your upcoming event registrations</p>
      </div>

      {events.length === 0 ? (
        <p className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">No active registered events.</p>
      ) : (
        <div className="space-y-4">
          {events.map((e) => (
            <EventTicketCard
              key={e.registration_id} 
              event={e}
              onCancel={() => setCancelModalId(e.registration_id)} 
              onRequestRefund={() => setRefundModalId(e.event_payments?.id)} 
            />
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Cancel Registration?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to cancel your ticket?</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelModalId(null)} disabled={isProcessing} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">Keep Ticket</button>
              <button onClick={executeCancel} disabled={isProcessing} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 flex justify-center items-center">
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600"><RefreshCw size={20} /><h3 className="font-bold text-slate-800">Request Refund</h3></div>
              <button onClick={() => setRefundModalId(null)} disabled={isProcessing} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason for refund</label>
              <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={3} className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500 text-sm mb-5 resize-none" placeholder="Why do you need a refund?" />
              <button onClick={executeRefund} disabled={isProcessing || !refundReason.trim()} className="w-full py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 flex justify-center items-center disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium flex items-center gap-3 z-50">{toastMsg}</div>
      )}
    </div>
  );
};

export default MyEvents;