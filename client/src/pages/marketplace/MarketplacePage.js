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
  approveMarketplaceRefund,
} from "../../api/marketplace.api";

// Component Imports
import ProductCard from "../../components/marketplace/ProductCard";
import SellItemModal from "../../components/marketplace/SellItemModal"; 
import OrderCard from "../../components/marketplace/OrderCard"; 
import PaymentCard from "../../components/marketplace/PaymentCard";
import MarketplaceTabs from "../../components/marketplace/MarketplaceTabs"; // ✅ NEW TABS IMPORT

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

  // Sell Item Modal State
  const [sellModal, setSellModal] = useState(false);

  // Post product form states
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCategory, setPCategory] = useState("GENERAL");
  const [pPrice, setPPrice] = useState("");
  const [pQty, setPQty] = useState("");

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

  async function handlePostProduct(e, modalData = null) {
    if (e && e.preventDefault) e.preventDefault();
    
    const name = modalData?.pName || pName;
    const price = modalData?.pPrice || pPrice;
    const qty = modalData?.pQty || pQty;
    const desc = modalData?.pDesc || pDesc;
    const cat = modalData?.pCategory || pCategory;

    if (!name || !price || !qty) {
      alert("Name, price and quantity are required");
      return;
    }

    try {
      await createMarketplaceProduct({
        name: name,
        description: desc,
        category: cat,
        price: Number(price),
        quantity: Number(qty),
      });

      alert("Product submitted ✅ (waiting for admin approval)");
      
      // Reset local state
      setPName(""); setPDesc(""); setPPrice(""); setPQty("");
      setPCategory("GENERAL");
      
      // Close the modal after successful posting
      setSellModal(false);

      await loadData();
    } catch (err) {
      alert(err.message);
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

  // ==========================================
  // TAB CONTENT SECTIONS
  // ==========================================

  const browseSection = (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Marketplace
        </h2>
        {isResident && (
          <button
            onClick={() => setSellModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + Sell Item
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-slate-500">No products available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isResident={isResident}
              isAdmin={isAdmin}
              orderQty={orderQtyMap[p.id] || 1}
              setQty={(id, qty) =>
                setOrderQtyMap((prev) => ({ ...prev, [id]: qty }))
              }
              onBuy={handlePlaceOrder}
              onApprove={handleApprove}
              loading={orderingId === p.id}
            />
          ))}
        </div>
      )}
    </div>
  );

  const ordersSection = (
    <div>
      {loading ? (
        <p className="text-slate-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-slate-500">No orders found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              isResident={isResident}
              isAdmin={isAdmin}
              paymentMethods={paymentMethods}
              paymentMethodMap={paymentMethodMap}
              setPaymentMethodMap={setPaymentMethodMap}
              handlePayOrder={handlePayOrder}
              payingOrderId={payingOrderId}
              handleRefundRequest={handleRefundRequest}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );

  const paymentsSection = (
    <div>
      {loading ? (
        <p className="text-slate-500">Loading payments...</p>
      ) : payments.length === 0 ? (
        <p className="text-slate-500">No payments found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((p) => (
            <PaymentCard
              key={p.id}
              payment={p}
              isAdmin={isAdmin}
              navigate={navigate}
              handleApproveRefund={handleApproveRefund}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div style={{ padding: 20 }}>
      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <strong className="text-slate-700">Role:</strong> <span className="text-indigo-600 font-medium">{roleName || "Unknown"}</span>
        </div>
        <button onClick={loadData} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Refresh Data
        </button>
      </div>

      {/* ✅ NEW TABBED INTERFACE */}
      <MarketplaceTabs
        browseContent={browseSection}
        ordersContent={ordersSection}
        paymentsContent={paymentsSection}
      />

      {/* Modal is kept entirely separate so it can float over the UI */}
      <SellItemModal
        open={sellModal}
        onClose={() => setSellModal(false)}
        onSubmit={handlePostProduct}
        categories={categories}
      />

    </div>
  );
}