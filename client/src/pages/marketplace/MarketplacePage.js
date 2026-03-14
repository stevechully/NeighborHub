import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ShoppingCart, RefreshCw, PackagePlus, Loader2 } from "lucide-react";

// ✅ Global Hooks
import { useCart } from "../../context/CartContext";
import { usePayment } from "../../components/payments/PaymentContext"; 

// API Methods
import {
  fetchMarketplaceProducts,
  fetchAllMarketplaceProducts,
  approveMarketplaceProduct,
  createMarketplaceProduct,
  fetchMyMarketplaceOrders,
  fetchAllMarketplaceOrders,
  fetchMyMarketplacePayments,
  fetchAllMarketplacePayments,
  requestMarketplaceRefund,
  approveMarketplaceRefund,
} from "../../api/marketplace.api";

// Component Imports
import ProductCard from "../../components/marketplace/ProductCard";
import SellItemModal from "../../components/marketplace/SellItemModal"; 
import OrderCard from "../../components/marketplace/OrderCard"; 
import PaymentCard from "../../components/marketplace/PaymentCard";
import MarketplaceTabs from "../../components/marketplace/MarketplaceTabs";

export default function MarketplacePage() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Initialize Global Contexts
  const { addToCart, itemCount } = useCart();
  const { openPayment } = usePayment();

  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isAdmin = roleName === "ADMIN";
  const isResident = roleName === "RESIDENT";

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [sellModal, setSellModal] = useState(false);
  const [orderQtyMap, setOrderQtyMap] = useState({});
  const [toastMsg, setToastMsg] = useState("");

  const categories = useMemo(
    () => ["GENERAL", "FOOD", "GROCERY", "ELECTRONICS", "HOME", "OTHER"],
    []
  );

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

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
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!authLoading && profile) {
      loadData();
    }
  }, [authLoading, profile, loadData]);

  // --- ACTIONS ---

  async function handleApprove(productId) {
    if (!window.confirm("Approve this product?")) return;
    try {
      await approveMarketplaceProduct(productId);
      showToast("Product approved ✅");
      await loadData();
    } catch (err) {
      showToast("❌ Approval failed");
    }
  }

  async function handlePostProduct(e, modalData) {
    if (e && e.preventDefault) e.preventDefault();
    
    try {
      await createMarketplaceProduct({
        name: modalData.pName,
        description: modalData.pDesc,
        category: modalData.pCategory,
        price: Number(modalData.pPrice),
        quantity: Number(modalData.pQty),
      });

      showToast("Listing submitted for approval ✅");
      setSellModal(false);
      await loadData();
    } catch (err) {
      showToast("❌ Submission failed");
    }
  }

  function handleAddToCart(product) {
    const qty = Number(orderQtyMap[product.id] || 1);
    
    if (qty > product.quantity) {
      showToast("⚠️ Not enough stock available");
      return;
    }

    addToCart(product, qty);
    showToast(`Added ${qty}x ${product.name} to cart 🛒`);
    
    // Reset qty for this product
    setOrderQtyMap((prev) => ({ ...prev, [product.id]: 1 }));
  }

  function handlePayOrder(order) {
    openPayment({
      module: "MARKETPLACE_ORDER",
      referenceId: order.id,
      amount: order.marketplace_products.price * order.quantity,
      itemName: order.marketplace_products.name,
      onSuccess: () => {
        showToast("Payment Success ✅");
        loadData();
      }
    });
  }

  const handleRefundRequest = async (paymentId) => {
    const reason = window.prompt("Reason for refund?", "Product defect or other issue");
    if (!reason) return;

    try {
      await requestMarketplaceRefund(paymentId, reason);
      showToast("Refund requested 🟡");
      loadData();
    } catch (err) {
      showToast("❌ Request failed");
    }
  };

  const handleApproveRefund = async (paymentId) => {
    if (!window.confirm("Approve this refund?")) return;
    try {
      await approveMarketplaceRefund(paymentId);
      showToast("Refund completed 🟢");
      loadData();
    } catch (err) {
      showToast("❌ Approval failed");
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin mx-auto text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4 font-medium">Loading Marketplace...</p>
      </div>
    );
  }

  // --- SECTIONS ---

  const browseSection = (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Available Products</h2>
          <p className="text-sm text-slate-500">Shop items from your neighbors</p>
        </div>
        
        <div className="flex gap-3">
          {isResident && (
            <>
              <button
                onClick={() => setSellModal(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
              >
                <PackagePlus size={18} /> Sell Item
              </button>
              
              <button
                onClick={() => navigate("/marketplace/cart")}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-100"
              >
                <ShoppingCart size={18} />
                Cart {itemCount > 0 && (
                  <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-[10px] ml-1">
                    {itemCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-center py-20 text-slate-400">Fetching products...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">No products listed in your community yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isResident={isResident}
              isAdmin={isAdmin}
              orderQty={orderQtyMap[p.id] || 1}
              setQty={(id, qty) => setOrderQtyMap((prev) => ({ ...prev, [id]: qty }))}
              onAddToCart={() => handleAddToCart(p)}
              onApprove={handleApprove}
            />
          ))}
        </div>
      )}
    </div>
  );

  const ordersSection = (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          isResident={isResident}
          isAdmin={isAdmin}
          handlePayOrder={() => handlePayOrder(o)}
          handleRefundRequest={handleRefundRequest}
          navigate={navigate}
        />
      ))}
    </div>
  );

  const paymentsSection = (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Role Info & Refresh */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
            {roleName}
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Marketplace</h1>
        </div>
        <button 
          onClick={loadData} 
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
          title="Refresh Data"
        >
          <RefreshCw size={22} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <MarketplaceTabs
        browseContent={browseSection}
        ordersContent={ordersSection}
        paymentsContent={paymentsSection}
      />

      <SellItemModal
        open={sellModal}
        onClose={() => setSellModal(false)}
        onSubmit={handlePostProduct}
        categories={categories}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium z-50 animate-in slide-in-from-bottom-5 duration-300">
          {toastMsg}
        </div>
      )}

    </div>
  );
}