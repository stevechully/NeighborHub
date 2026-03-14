import { useEffect, useState, useCallback } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../../auth/AuthContext";
import { Loader2, Receipt } from "lucide-react";

import { fetchMyMaintenanceInvoices, fetchAllMaintenanceInvoices, generateMaintenanceInvoices, markInvoicePaid, deleteInvoice } from "../../api/maintenance.api";
import { fetchMyPayments, fetchAllPayments } from "../../api/payments.api";

// ✅ Import Global Payment Hook
import { usePayment } from "../../components/payments/PaymentContext"; 

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { openPayment } = usePayment(); // ✅ Initialize hook

  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isAdmin = roleName === "ADMIN";
  const isResident = roleName === "RESIDENT";

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true); 

  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const [allInv, allPay] = await Promise.all([
          fetchAllMaintenanceInvoices(),
          fetchAllPayments()
        ]);
        setInvoices(allInv || []);
        setPayments(allPay || []);
      } else if (isResident) {
        const [myInv, myPay] = await Promise.all([
          fetchMyMaintenanceInvoices(),
          fetchMyPayments()
        ]);
        setInvoices(myInv || []);
        setPayments(myPay || []);
      }
    } catch (err) {
      console.error("❌ Load failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isResident]);

  useEffect(() => {
    if (!authLoading && profile) {
      loadData();
    }
  }, [authLoading, profile, loadData]); 

  async function handleGenerateInvoices(e) {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await generateMaintenanceInvoices({ amount: Number(amount), due_date: dueDate });
      showToast(res.message || "Invoices generated ✅");
      loadData();
    } catch (err) { 
      showToast("❌ " + err.message); 
    } finally { 
      setGenerating(false); 
    }
  }

  async function handleMarkPaid(id) {
    if (!window.confirm("Mark as PAID via Cash?")) return;
    try { await markInvoicePaid(id); loadData(); showToast("Invoice marked paid ✅"); } catch (err) { showToast("❌ " + err.message); }
  }

  async function handleDeleteInvoice(id) {
    if (!window.confirm("Delete permanently?")) return;
    try { await deleteInvoice(id); loadData(); showToast("Invoice deleted ✅"); } catch (err) { showToast("❌ " + err.message); }
  }

  // ✅ NEW: Trigger the Global Payment Modal for Maintenance
  const handlePayInvoice = (invoice) => {
    openPayment({
      module: "MAINTENANCE",
      referenceId: invoice.id,
      amount: invoice.amount,
      itemName: `Maintenance Dues (${invoice.due_date})`,
      onSuccess: () => {
        showToast("Payment Successful! ✅");
        loadData(); // Refresh table to show PAID
      }
    });
  };

  if (authLoading || !profile) {
    return (
      <div className="p-10 flex justify-center items-center">
        <p className="text-slate-500 font-medium animate-pulse">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 relative">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">Maintenance & Dues</h2>
        <p className="text-sm text-slate-500 mt-1">Manage community billing and transaction history</p>
      </div>

      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Generate Monthly Invoices</h3>
          <form onSubmit={handleGenerateInvoices} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="e.g. 1500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input type="date" required min={new Date().toISOString().split("T")[0]} value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            <button type="submit" disabled={generating} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex justify-center items-center h-[42px]">
              {generating ? <Loader2 className="animate-spin" size={20} /> : "Generate"}
            </button>
          </form>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">No invoices found.</td></tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">₹{inv.amount}</td>
                    <td className="px-6 py-4">{inv.due_date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        inv.status === "PAID" ? "bg-green-100 text-green-700" :
                        inv.status === "OVERDUE" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isResident && inv.status !== "PAID" && (
                        <button onClick={() => handlePayInvoice(inv)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                          Pay Now
                        </button>
                      )}
                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          {inv.status !== "PAID" && <button onClick={() => handleMarkPaid(inv.id)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Mark Paid</button>}
                          <button onClick={() => handleDeleteInvoice(inv.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Paid On</th>
                <th className="px-6 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">No past transactions.</td></tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{p.payment_method}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">₹{p.amount_paid}</td>
                    <td className="px-6 py-4">{new Date(p.paid_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => navigate(`/payments/${p.id}/receipt`)} className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors">
                        <Receipt size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium flex items-center gap-3 transition-all z-50 animate-bounce-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}