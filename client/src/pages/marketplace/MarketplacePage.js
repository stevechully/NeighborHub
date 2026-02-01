import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Added import
import { useAuth } from "../../auth/AuthContext";
import {
  fetchMarketplaceProducts,
  fetchAllMarketplaceProducts,
  approveMarketplaceProduct,
  createMarketplaceProduct,
  placeMarketplaceOrder,
  fetchMarketplaceOrders,
  // ✅ New imports for payments
  fetchMyMarketplacePayments,
  fetchAllMarketplacePayments,
  payMarketplaceOrder, 
} from "../../api/marketplace.api";

export default function MarketplacePage() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate(); // ✅ Init navigate

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";
  const isResident = roleName === "RESIDENT";

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  // ✅ Payment States
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

  // ✅ Payment Action States
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("MOCK_UPI");

  const categories = useMemo(
    () => ["GENERAL", "FOOD", "GROCERY", "ELECTRONICS", "HOME", "OTHER"],
    []
  );

  const paymentMethods = useMemo(
    () => ["MOCK_UPI", "MOCK_CARD", "CASH", "BANK_TRANSFER"],
    []
  );

  /**
   * LOAD DATA
   * - Products: Admin gets ALL, Resident gets APPROVED
   * - Payments: Admin gets ALL, Resident gets THEIRS
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const productPromise = isAdmin 
        ? fetchAllMarketplaceProducts() 
        : fetchMarketplaceProducts();

      // ✅ Fetch payments based on role
      const paymentsPromise = isAdmin
        ? fetchAllMarketplacePayments()
        : fetchMyMarketplacePayments();

      const [prodData, orderData, payData] = await Promise.all([
        productPromise,
        fetchMarketplaceOrders(),
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

  /**
   * ADMIN: Approve Product
   */
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

  /**
   * SELLER: Post Product
   */
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

  /**
   * RESIDENT: Place Order
   */
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

  /**
   * RESIDENT: Pay for Order
   */
  async function handlePayOrder(orderId) {
    try {
      setPayingOrderId(orderId);

      const res = await payMarketplaceOrder(orderId, {
        payment_method: paymentMethod,
      });

      alert(`Payment success ✅ Ref: ${res.transaction_ref}`);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setPayingOrderId(null);
    }
  }

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
        <button onClick={loadData}>Refresh</button>
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
          <button type="submit" disabled={posting}>{posting ? "Posting..." : "Post Product"}</button>
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
                    fontSize: "0.7rem", padding: "2px 6px", borderRadius: 4, 
                    background: p.is_approved ? "#e6fffa" : "#fffbe6",
                    color: p.is_approved ? "#2c7a7b" : "#b7791f"
                  }}>
                    {p.is_approved ? "LIVE" : "PENDING"}
                  </span>
                </div>
                <p style={{ margin: "6px 0", color: "#666", fontSize: "0.9rem" }}>{p.description}</p>
                <p style={{ margin: "4px 0", fontSize: "0.9rem" }}><b>Price:</b> ₹{p.price} | <b>Stock:</b> {p.quantity}</p>

                {/* ADMIN APPROVE BUTTON */}
                {isAdmin && p.is_approved === false && (
                  <button
                    onClick={() => handleApprove(p.id)}
                    style={{
                      marginTop: 10, padding: "8px", background: "#28a745", color: "white", 
                      border: "none", borderRadius: 6, cursor: "pointer", width: "100%"
                    }}
                  >
                    Approve Product
                  </button>
                )}

                {/* RESIDENT BUY BUTTON */}
                {isResident && p.is_approved && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <input
                      type="number"
                      min="1"
                      style={{ width: 60 }}
                      value={orderQtyMap[p.id] || 1}
                      onChange={(e) => setOrderQtyMap((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <button style={{ flex: 1 }} onClick={() => handlePlaceOrder(p.id)} disabled={orderingId === p.id}>
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
        <h3>Orders</h3>
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ background: "#f3f3f3" }}>
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
                   // Calculate Total if product data exists
                   const totalCost = o.marketplace_products?.price 
                     ? o.marketplace_products.price * o.quantity 
                     : "—";

                   return (
                    <tr key={o.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td>{o.marketplace_products?.name || "Product"}</td>
                      <td>{o.quantity}</td>
                      <td>₹ {totalCost}</td>
                      <td><b>{o.status}</b></td>
                      
                      {/* ✅ Payment Status Column */}
                      <td>
                        <b style={{ 
                          color: o.payment_status === "PAID" ? "green" : "orange" 
                        }}>
                          {o.payment_status || "UNPAID"}
                        </b>
                      </td>

                      {/* ✅ Action Column (Pay Button) */}
                      <td>
                        {isResident && o.payment_status !== "PAID" ? (
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select
                              style={{ padding: 4 }}
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                              {paymentMethods.map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>

                            <button
                              disabled={payingOrderId === o.id}
                              onClick={() => handlePayOrder(o.id)}
                              style={{ cursor: "pointer" }}
                            >
                              {payingOrderId === o.id ? "Paying..." : "Pay Now"}
                            </button>
                          </div>
                        ) : (
                          <span>{o.payment_status === "PAID" ? "Completed" : "—"}</span>
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

      {/* ✅ NEW: MARKETPLACE PAYMENTS TABLE */}
      <div style={cardStyle}>
        <h3>{isAdmin ? "All Marketplace Payments" : "My Marketplace Payments"}</h3>

        {loading ? (
          <p>Loading payments...</p>
        ) : payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ background: "#f3f3f3" }}>
                  <th align="left">Method</th>
                  <th align="left">Amount</th>
                  <th align="left">Reference</th>
                  <th align="left">Paid At</th>
                  <th align="left">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td>{p.payment_method}</td>
                    <td>₹ {p.amount_paid}</td>
                    <td>{p.transaction_ref}</td>
                    <td>{p.paid_at ? new Date(p.paid_at).toLocaleString() : "-"}</td>
                    <td>
                      <button onClick={() => navigate(`/marketplace/payments/${p.id}/receipt`)}>
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

const cardStyle = { background: "#fff", padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };
const inputStyle = { padding: "10px", borderRadius: 6, border: "1px solid #ddd", flex: "1 1 150px" };
const productCardStyle = { background: "#fff", padding: 16, borderRadius: 10, border: "1px solid #edf2f7", display: "flex", flexDirection: "column", justifyContent: "space-between" };