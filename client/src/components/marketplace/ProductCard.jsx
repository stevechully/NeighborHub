import { ShoppingCart, CheckCircle, Clock } from "lucide-react";

export default function ProductCard({
  product,
  isResident,
  isAdmin,
  orderQty,
  setQty,
  onAddToCart, // ✅ Changed from onBuy
  onApprove,
  loading
}) {
  const isOutOfStock = product.quantity <= 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col justify-between group">
      
      <div>
        {/* Header with Status Badge */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>

          <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold flex items-center gap-1
            ${product.is_approved
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"}
          `}>
            {product.is_approved ? (
              <><CheckCircle size={12} /> Live</>
            ) : (
              <><Clock size={12} /> Pending</>
            )}
          </span>
        </div>

        {/* Category Badge */}
        <div className="inline-block text-[11px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-md mb-3">
          {product.category}
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {product.description}
        </p>

        {/* Price & Stock info */}
        <div className="flex justify-between items-end mb-5">
          <div>
            <p className="text-xs text-slate-400 font-medium">Price</p>
            <p className="text-xl font-black text-slate-900">₹{product.price}</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Availability</p>
            <p className={`text-sm font-bold ${isOutOfStock ? "text-red-500" : "text-slate-600"}`}>
              {isOutOfStock ? "Out of Stock" : `${product.quantity} units`}
            </p>
          </div>
        </div>
      </div>

      {/* --- ACTIONS --- */}
      <div className="space-y-2">
        {/* Admin Approve Button */}
        {isAdmin && !product.is_approved && (
          <button
            onClick={() => onApprove(product.id)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Approve Listing
          </button>
        )}

        {/* Resident Add to Cart Flow */}
        {isResident && product.is_approved && (
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={product.quantity}
              value={orderQty}
              disabled={isOutOfStock}
              onChange={(e) => setQty(product.id, parseInt(e.target.value) || 1)}
              className="w-16 border border-slate-200 rounded-xl px-2 py-1 text-center font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
            />

            <button
              onClick={() => onAddToCart(product, Number(orderQty))}
              disabled={loading || isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all shadow-sm
                ${isOutOfStock 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95"}
              `}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart size={18} />
                  {isOutOfStock ? "Sold Out" : "Add to Cart"}
                </>
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}