import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMarketplacePaymentReceipt } from "../../api/marketplace.api";

export default function MarketplaceReceiptPage() {
  const { id } = useParams(); // paymentId
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadReceipt() {
    try {
      setLoading(true);
      const data = await fetchMarketplacePaymentReceipt(id);
      setReceipt(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReceipt();
    // eslint-disable-next-line
  }, [id]);

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2>Marketplace Receipt</h2>
        <button onClick={() => navigate(-1)}>⬅ Back</button>
      </div>

      {loading ? (
        <p>Loading receipt...</p>
      ) : !receipt ? (
        <p>No receipt found.</p>
      ) : (
        <div style={{
          background: "#fff",
          padding: 24,
          borderRadius: 10,
          maxWidth: 600,
          margin: "0 auto",
          border: "1px solid #ddd",
        }}>
          <h3 style={{ textAlign: "center", marginBottom: 20 }}>
            Resident Portal - Marketplace Receipt
          </h3>

          <p><b>Receipt No:</b> {receipt.receipt_no}</p>
          <p><b>Amount Paid:</b> ₹{receipt.amount_paid}</p>
          <p><b>Payment Method:</b> {receipt.payment_method}</p>
          <p><b>Paid At:</b> {new Date(receipt.paid_at).toLocaleString()}</p>

          <hr style={{ margin: "20px 0" }} />

          <p style={{ fontSize: 14, color: "#666" }}>
            This is a system generated receipt.
          </p>

          <button
            onClick={() => window.print()}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "10px 12px",
              cursor: "pointer",
            }}
          >
            🖨 Print Receipt
          </button>
        </div>
      )}
    </div>
  );
}
