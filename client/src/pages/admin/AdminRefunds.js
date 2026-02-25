import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../../lib/supabase";

const BACKEND_URL = "http://localhost:4000/api";

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await axios.get(`${BACKEND_URL}/refunds?status=PENDING`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setRefunds(res.data);
    } catch (err) {
      console.error("Fetch refunds failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this refund?`)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.patch(`${BACKEND_URL}/refunds/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      alert(`Refund ${action}ed successfully!`);
      fetchRefunds();
    } catch (err) {
      alert(`Action failed: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading requests...</div>;

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ marginBottom: "20px" }}>Refund Management (Pending)</h2>

      {refunds.length === 0 ? (
        <div style={{ padding: 40, background: "#fff", borderRadius: 12, textAlign: 'center', color: '#666' }}>
          No pending refund requests found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {refunds.map((refund) => (
            <div
              key={refund.id}
              style={{
                border: "1px solid #e5e7eb",
                padding: "20px",
                borderRadius: "12px",
                background: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase' }}>
                    {refund.payment_type}
                  </span>
                  <h3 style={{ margin: "4px 0" }}>₹{refund.refund_amount}</h3>
                </div>
                <div style={{ textAlign: 'right', fontSize: '14px' }}>
                  <div style={{ fontWeight: '600' }}>{refund.profiles?.full_name}</div>
                  <div style={{ color: '#6b7280' }}>{refund.profiles?.email}</div>
                </div>
              </div>

              <div style={{ margin: '16px 0', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px' }}>
                <strong>Reason:</strong> {refund.reason}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  style={{
                    backgroundColor: "#166534",
                    color: "white",
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  onClick={() => handleAction(refund.id, 'approve')}
                >
                  Approve Refund
                </button>

                <button
                  style={{
                    backgroundColor: "#991b1b",
                    color: "white",
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  onClick={() => handleAction(refund.id, 'reject')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}