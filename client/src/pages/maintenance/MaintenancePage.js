import { useEffect, useMemo, useState, useCallback } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../../auth/AuthContext";
import {
  fetchMyMaintenanceInvoices,
  fetchAllMaintenanceInvoices,
  generateMaintenanceInvoices,
  markInvoicePaid,
  deleteInvoice,
} from "../../api/maintenance.api";

import { mockPayInvoice, fetchMyPayments, fetchAllPayments } from "../../api/payments.api";

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isAdmin = roleName === "ADMIN";
  const isResident = roleName === "RESIDENT";

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true); 

  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [generating, setGenerating] = useState(false);

  const [payingId, setPayingId] = useState(null);
  const paymentMethods = useMemo(() => ["MOCK_UPI", "MOCK_CARD", "CASH", "BANK_TRANSFER"], []);
  const [paymentMethod, setPaymentMethod] = useState("MOCK_UPI"); 

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
      await generateMaintenanceInvoices({ amount: Number(amount), due_date: dueDate });
      alert("Invoices generated ✅");
      loadData();
    } catch (err) { alert(err.message); } finally { setGenerating(false); }
  }

  async function handleMarkPaid(id) {
    if (!window.confirm("Mark as PAID?")) return;
    try { await markInvoicePaid(id); loadData(); } catch (err) { alert(err.message); }
  }

  async function handleDeleteInvoice(id) {
    if (!window.confirm("Delete permanently?")) return;
    try { await deleteInvoice(id); loadData(); } catch (err) { alert(err.message); }
  }

  async function handleMockPay(id) {
    try {
      setPayingId(id);
      await mockPayInvoice({ invoice_id: id, payment_method: paymentMethod });
      alert("Payment success ✅");
      loadData();
    } catch (err) { alert(err.message); } finally { setPayingId(null); }
  }

  if (authLoading || !profile) return <div style={{ padding: 40 }}>Verifying session...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Maintenance & Payments</h2>

      {isAdmin && (
        <div style={{ background: "#fff", padding: 16, borderRadius: 10, marginBottom: 16 }}>
          <h3>Admin: Generate Invoices</h3>
          <form onSubmit={handleGenerateInvoices} style={{ display: "flex", gap: 10 }}>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
            {/* ✅ FIX APPLIED HERE */}
            <input 
              type="date" 
              min={new Date().toISOString().split("T")[0]} 
              value={dueDate} 
              onChange={e => setDueDate(e.target.value)} 
            />
            <button type="submit" disabled={generating}>{generating ? "..." : "Generate"}</button>
          </form>
        </div>
      )}

      <div style={{ background: "#fff", padding: 16, borderRadius: 10, marginBottom: 16 }}>
        <h3>Invoices</h3>
        {loading ? <p>Loading...</p> : (
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f3f3" }}>
                <th align="left">Amount</th><th align="left">Due Date</th><th align="left">Status</th><th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>₹ {inv.amount}</td><td>{inv.due_date}</td><td>{inv.status}</td>
                  <td>
                    {isResident && inv.status !== "PAID" && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <button onClick={() => handleMockPay(inv.id)} disabled={payingId === inv.id}>
                          {payingId === inv.id ? "..." : "Pay Now"}
                        </button>
                      </div>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => handleMarkPaid(inv.id)}>Mark Paid</button>
                        <button onClick={() => handleDeleteInvoice(inv.id)} style={{ marginLeft: 5 }}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: "#fff", padding: 16, borderRadius: 10 }}>
        <h3>Payment History</h3>
        <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th align="left">Method</th><th align="left">Amount</th><th align="left">Paid At</th><th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{p.payment_method}</td><td>₹ {p.amount_paid}</td><td>{p.paid_at}</td>
                <td>
                  <button 
                    onClick={() => navigate(`/payments/${p.id}/receipt`)}
                    style={{ background: "#007bff", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 4, cursor: "pointer" }}
                  >
                    View Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}