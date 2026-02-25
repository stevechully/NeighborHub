import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  fetchMarketplaceProducts,
  fetchAllMarketplaceProducts,
  approveMarketplaceProduct,
  createMarketplaceProduct,
  placeMarketplaceOrder,
  fetchMyMarketplaceOrders,
  fetchAllMarketplaceOrders,
  fetchMyMarketplacePayments,
  fetchAllMarketplacePayments,
  payMarketplaceOrder,
  requestMarketplaceRefund,
  approveMarketplaceRefund, // ✅ NEW: Added Admin approval API import
} from "../../api/marketplace.api";

export default function MarketplacePage() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";
  const isResident = roleName === "RESIDENT";

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Post product form states
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCategory, setPCategory] = useState("GENERAL");
  const [pPrice, setPPrice] = useState("");
  const [pQty, setPQty] = useState("");
  const [posting, setPosting] = useState(false);

  // Ordering states
  const [orderQtyMap, setOrderQtyMap] = useState({});
  const [orderingId, setOrderingId] = useState(null);

  // Payment Action States 
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [paymentMethodMap, setPaymentMethodMap] = useState({});

  const categories = useMemo(
    () => ["GENERAL", "FOOD", "GROCERY", "ELECTRONICS", "HOME", "OTHER"],
    []
  );

  const paymentMethods = useMemo(
    () => ["MOCK_UPI", "MOCK_CARD", "CASH", "BANK_TRANSFER"],
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const productPromise = isAdmin 
        ? fetchAllMarketplaceProducts() 
        : fetchMarketplaceProducts();

      const paymentsPromise = isAdmin
        ? fetchAllMarketplacePayments()
        : fetchMyMarketplacePayments();

      const ordersPromise = isAdmin
        ? fetchAllMarketplaceOrders()
        : fetchMyMarketplaceOrders();

      const [prodData, orderData, payData] = await Promise.all([
        productPromise,
        ordersPromise, 
        paymentsPromise,
      ]);

      setProducts(prodData || []);
      setOrders(orderData || []);
      setPayments(payData || []);
    } catch (err) {
      console.error("❌ Marketplace load failed:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!authLoading && profile) {
      loadData();
    }
  }, [authLoading, profile, loadData]);

  async function handleApprove(productId) {
    if (!window.confirm("Approve this product?")) return;
    try {
      await approveMarketplaceProduct(productId);
      alert("Product approved ✅");
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePostProduct(e) {
    e.preventDefault();
    if (!pName || !pPrice || !pQty) {
      alert("Name, price and quantity are required");
      return;
    }

    try {
      setPosting(true);
      await createMarketplaceProduct({
        name: pName,
        description: pDesc,
        category: pCategory,
        price: Number(pPrice),
        quantity: Number(pQty),
      });

      alert("Product submitted ✅ (waiting for admin approval)");
      setPName(""); setPDesc(""); setPPrice(""); setPQty("");
      setPCategory("GENERAL");

      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function handlePlaceOrder(productId) {
    const qty = Number(orderQtyMap[productId] || 1);
    if (!qty || qty <= 0) {
      alert("Enter a valid quantity");
      return;
    }

    try {
      setOrderingId(productId);
      await placeMarketplaceOrder({
        product_id: productId,
        quantity: qty,
      });

      alert("Order placed ✅");
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setOrderingId(null);
    }
  }

  async function handlePayOrder(orderId) {
    try {
      setPayingOrderId(orderId);
      
      const method = paymentMethodMap[orderId] || "MOCK_UPI";

      const res = await payMarketplaceOrder(orderId, {
        payment_method: method,
      });

      alert(`Payment success ✅ Ref: ${res.transaction_ref}`);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setPayingOrderId(null);
    }
  }

  const handleRefundRequest = async (paymentId) => {
    const reason = window.prompt("Reason for refund?", "Product defect or other issue");
    if (!reason) return;

    try {
      await requestMarketplaceRefund(paymentId, reason);
      alert("Refund request submitted successfully! 🟡");
      loadData();
    } catch (err) {
      alert(err.message || "Request failed");
    }
  };

  // ✅ NEW: Admin handler to approve refunds
  const handleApproveRefund = async (paymentId) => {
    if (!window.confirm("Approve this refund and mark the order as cancelled?")) return;
    try {
      await approveMarketplaceRefund(paymentId);
      alert("Refund processed successfully! 🟢");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to approve refund");
    }
  };

  if (authLoading || !profile) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h3>Verifying session...</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Marketplace</h2>
        <button onClick={loadData} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
          Refresh Data
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Role:</strong> {roleName || "Unknown"}
      </div>

      {/* POST PRODUCT SECTION */}
      <div style={cardStyle}>
        <h3>Post a Product (Seller)</h3>
        <form onSubmit={handlePostProduct} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input style={inputStyle} placeholder="Product name" value={pName} onChange={(e) => setPName(e.target.value)} />
          <input style={inputStyle} placeholder="Description" value={pDesc} onChange={(e) => setPDesc(e.target.value)} />
          <select style={inputStyle} value={pCategory} onChange={(e) => setPCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input style={inputStyle} type="number" placeholder="Price" value={pPrice} onChange={(e) => setPPrice(e.target.value)} />
          <input style={inputStyle} type="number" placeholder="Qty" value={pQty} onChange={(e) => setPQty(e.target.value)} />
          <button type="submit" disabled={posting} style={btnStyle}>{posting ? "Posting..." : "Post Product"}</button>
        </form>
      </div>

      {/* PRODUCTS LIST */}
      <div style={cardStyle}>
        <h3>Available Products</h3>
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {products.map((p) => (
              <div key={p.id} style={productCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h4 style={{ margin: 0 }}>{p.name}</h4>
                  <span style={{ 
                    fontSize: "0.7rem", padding: "4px 8px", borderRadius: 12, fontWeight: "bold",
                    background: p.is_approved ? "#d1fae5" : "#fef3c7",
                    color: p.is_approved ? "#065f46" : "#92400e"
                  }}>
                    {p.is_approved ? "LIVE" : "PENDING"}
                  </span>
                </div>
                <p style={{ margin: "6px 0", color: "#666", fontSize: "0.9rem" }}>{p.description}</p>
                <p style={{ margin: "4px 0", fontSize: "0.9rem" }}><b>Price:</b> ₹{p.price} | <b>Stock:</b> {p.quantity}</p>

                {isAdmin && p.is_approved === false && (
                  <button
                    onClick={() => handleApprove(p.id)}
                    style={{
                      marginTop: 10, padding: "8px", background: "#16a34a", color: "white", 
                      border: "none", borderRadius: 6, cursor: "pointer", width: "100%"
                    }}
                  >
                    Approve Product
                  </button>
                )}

                {isResident && p.is_approved && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <input
                      type="number"
                      min="1"
                      style={{ width: 60, borderRadius: 6, border: "1px solid #ddd", padding: 4 }}
                      value={orderQtyMap[p.id] || 1}
                      onChange={(e) => setOrderQtyMap((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <button style={{ ...btnStyle, flex: 1 }} onClick={() => handlePlaceOrder(p.id)} disabled={orderingId === p.id}>
                      {orderingId === p.id ? "..." : "Buy"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ORDERS TABLE */}
      <div style={cardStyle}>
        <h3>{isAdmin ? "All Orders" : "My Orders"}</h3>
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table width="100%" cellPadding="12" style={{ borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th align="left">Product</th>
                  <th align="left">Qty</th>
                  <th align="left">Total Cost</th>
                  <th align="left">Order Status</th>
                  <th align="left">Payment Status</th>
                  <th align="left">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                   const totalCost = o.marketplace_products?.price 
                     ? o.marketplace_products.price * o.quantity 
                     : "—";

                   const hasPayment = !!o.marketplace_payments?.id;
                   const displayOrderStatus = hasPayment ? (o.status === "REFUNDED" ? "REFUNDED" : "PAID") : o.status;
                   const displayPaymentStatus = hasPayment ? (o.payment_status === "REFUNDED" ? "REFUNDED" : "PAID") : (o.payment_status || "UNPAID");
                   const refundStatus = o.marketplace_payments?.refund_status || "NONE";

                   return (
                    <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td>{o.marketplace_products?.name || "Product"}</td>
                      <td>{o.quantity}</td>
                      <td style={{ fontWeight: "600" }}>₹{totalCost}</td>
                      
                      {/* ✅ Status Badges */}
                      <td>
                        <span style={getBadgeStyle(displayOrderStatus, "PAID")}>
                          {displayOrderStatus}
                        </span>
                      </td>
                      <td>
                        <span style={getBadgeStyle(displayPaymentStatus, "PAID", "UNPAID")}>
                          {displayPaymentStatus}
                        </span>
                      </td>

                      {/* ✅ Clean Action Column */}
                      <td>
                        {isResident && !hasPayment && displayPaymentStatus !== "PAID" ? (
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select
                              style={{ padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                              value={paymentMethodMap[o.id] || "MOCK_UPI"}
                              onChange={(e) => setPaymentMethodMap(prev => ({ ...prev, [o.id]: e.target.value }))}
                            >
                              {paymentMethods.map((m) => (
                                <option key={m} value={m}>{m.replace("_", " ")}</option>
                              ))}
                            </select>

                            <button
                              disabled={payingOrderId === o.id}
                              onClick={() => handlePayOrder(o.id)}
                              style={{ ...btnStyle, background: "#3b82f6" }}
                            >
                              {payingOrderId === o.id ? "Paying..." : "Pay Now"}
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                            {displayPaymentStatus === "PAID" && (
                              <span style={{ color: "#16a34a", fontWeight: "600", fontSize: "0.9em" }}>
                                Payment Completed ✅
                              </span>
                            )}
                            
                            {/* Refund Status Display */}
                            {refundStatus === "REQUESTED" && (
                              <div style={{ color: "#d97706", fontWeight: "bold", fontSize: "0.85em" }}>🟡 Refund Requested</div>
                            )}
                            {refundStatus === "REFUNDED" && (
                              <div style={{ color: "#16a34a", fontWeight: "bold", fontSize: "0.85em" }}>🟢 Refunded</div>
                            )}

                            {/* Request Refund Button */}
                            {isResident && hasPayment && refundStatus === "NONE" && displayPaymentStatus !== "REFUNDED" && (
                              <button 
                                onClick={() => handleRefundRequest(o.marketplace_payments.id)}
                                style={{
                                  backgroundColor: "#f59e0b", color: "white", padding: "6px 12px",
                                  borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.85em", fontWeight: "bold"
                                }}
                              >
                                Request Refund
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ COLLAPSIBLE MARKETPLACE PAYMENTS TABLE (Updated with Refund Approval) */}
      <details style={{ ...cardStyle, cursor: "pointer" }}>
        <summary style={{ fontSize: "1.17em", fontWeight: "bold", userSelect: "none" }}>
          {isAdmin ? "📁 View All Marketplace Payments" : "📁 View My Payment Receipts"}
        </summary>
        
        <div style={{ marginTop: "16px", cursor: "default" }}>
          {loading ? (
            <p>Loading payments...</p>
          ) : payments.length === 0 ? (
            <p>No payments found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th align="left">Method</th>
                    <th align="left">Amount</th>
                    <th align="left">Reference</th>
                    <th align="left">Refund Status</th> {/* ✅ NEW COLUMN */}
                    <th align="left">Action</th>        {/* ✅ CHANGED FROM RECEIPT */}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td>{p.payment_method}</td>
                      <td style={{ fontWeight: "600" }}>₹{p.amount_paid}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.9em" }}>{p.transaction_ref}</td>
                      
                      {/* ✅ Refund Status Display */}
                      <td>
                        {p.refund_status === "REQUESTED" ? (
                          <span style={{ color: "#d97706", fontWeight: "bold" }}>🟡 Requested</span>
                        ) : p.refund_status === "REFUNDED" ? (
                          <span style={{ color: "#16a34a", fontWeight: "bold" }}>🟢 Refunded</span>
                        ) : (
                          <span style={{ color: "#64748b" }}>None</span>
                        )}
                      </td>

                      {/* ✅ Admin Action Column */}
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button 
                            onClick={() => navigate(`/marketplace/payments/${p.id}/receipt`)}
                            style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer", background: "white" }}
                          >
                            Receipt
                          </button>
                          
                          {/* Show Approve button ONLY to Admins when a refund is requested */}
                          {isAdmin && p.refund_status === "REQUESTED" && (
                            <button 
                              onClick={() => handleApproveRefund(p.id)}
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#f59e0b", color: "white", fontWeight: "bold" }}
                            >
                              Approve Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>

    </div>
  );
}

// UI Helper Styles
const cardStyle = { background: "#fff", padding: 20, borderRadius: 12, marginBottom: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" };
const inputStyle = { padding: "10px", borderRadius: 6, border: "1px solid #cbd5e1", flex: "1 1 150px" };
const productCardStyle = { background: "#fff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const btnStyle = { padding: "8px 16px", background: "#0f172a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" };

// Helper function to render colored status badges
const getBadgeStyle = (status, successText, fallbackText = "PENDING") => {
  const isSuccess = status === successText;
  const isRefunded = status === "REFUNDED";
  
  return {
    padding: "4px 10px", 
    borderRadius: "12px", 
    fontSize: "0.75rem", 
    fontWeight: "bold",
    backgroundColor: isSuccess ? "#d1fae5" : isRefunded ? "#e0e7ff" : "#fee2e2",
    color: isSuccess ? "#065f46" : isRefunded ? "#3730a3" : "#991b1b",
    display: "inline-block"
  };
};