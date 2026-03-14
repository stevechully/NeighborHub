import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { usePayment } from "../../components/payments/PaymentContext"; // ✅ Global Payment Hook
import { Trash2, ShoppingCart, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, total, removeFromCart, clearCart } = useCart();
  const { openPayment } = usePayment(); // ✅ Initialize hook

  function handleCheckout() {
    if (cart.length === 0) return;

    openPayment({
      module: "MARKETPLACE_CART",
      referenceId: cart, // Pass the whole cart array to the backend!
      amount: total,
      itemName: `Marketplace Order (${cart.length} items)`,
      onSuccess: () => {
        clearCart();
        navigate("/marketplace"); // Go back to marketplace after success
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
      <button onClick={() => navigate(-1)} className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 transition-colors">
        <ArrowLeft size={18} /> Back to Marketplace
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <ShoppingCart className="text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">Your Cart</h2>
        </div>

        {cart.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <div>
            <ul className="divide-y divide-slate-100">
              {cart.map((item) => (
                <li key={item.product_id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <h3 className="font-semibold text-slate-800">{item.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">Quantity: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-slate-800">₹{item.price * item.quantity}</span>
                    <button onClick={() => removeFromCart(item.product_id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Amount</p>
                <p className="text-3xl font-black text-indigo-600">₹{total}</p>
              </div>
              <button onClick={handleCheckout} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-sm text-lg">
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}