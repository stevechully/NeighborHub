import { ShoppingCart } from "lucide-react";

export default function ProductCard({
  product,
  isResident,
  isAdmin,
  orderQty,
  setQty,
  onBuy,
  onApprove,
  loading
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition flex flex-col justify-between">

      {/* Header */}
      <div className="flex justify-between items-start mb-2">

        <h3 className="font-semibold text-gray-900">
          {product.name}
        </h3>

        <span className={`text-xs px-2 py-1 rounded-full font-medium
          ${product.is_approved
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"}
        `}>
          {product.is_approved ? "LIVE" : "PENDING"}
        </span>

      </div>

      {/* Category */}
      <div className="text-xs text-gray-500 mb-2">
        {product.category}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">
        {product.description}
      </p>

      {/* Price + Stock */}
      <div className="flex justify-between text-sm font-medium mb-3">

        <span className="text-indigo-600">
          ₹{product.price}
        </span>

        <span className="text-gray-500">
          Stock: {product.quantity}
        </span>

      </div>

      {/* Admin Approve */}
      {isAdmin && !product.is_approved && (
        <button
          onClick={() => onApprove(product.id)}
          className="w-full bg-green-600 text-white py-2 rounded-lg"
        >
          Approve Product
        </button>
      )}

      {/* Resident Buy */}
      {isResident && product.is_approved && (
        <div className="flex gap-2">

          <input
            type="number"
            min="1"
            value={orderQty}
            onChange={(e) => setQty(product.id, e.target.value)}
            className="w-16 border rounded-lg px-2 py-1"
          />

          <button
            onClick={() => onBuy(product.id)}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 flex items-center justify-center gap-2"
          >
            <ShoppingCart size={16} />
            {loading ? "..." : "Buy"}
          </button>

        </div>
      )}

    </div>
  );
}