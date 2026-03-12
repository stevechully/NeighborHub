import { useState } from "react";
import { X } from "lucide-react";

export default function SellItemModal({
  open,
  onClose,
  onSubmit,
  categories
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [category, setCategory] = useState("GENERAL");

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();

    onSubmit({
      name,
      description: desc,
      price,
      quantity: qty,
      category
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      {/* Modal Card */}
      <div className="bg-white rounded-xl shadow-xl w-[420px] p-6 relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold mb-4">
          Sell an Item
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            placeholder="Product name"
            className="w-full border rounded-lg p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <textarea
            placeholder="Description"
            className="w-full border rounded-lg p-2 h-20"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <select
            className="w-full border rounded-lg p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">

            <input
              type="number"
              placeholder="Price"
              className="border rounded-lg p-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <input
              type="number"
              placeholder="Quantity"
              className="border rounded-lg p-2"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />

          </div>

          <div className="flex justify-end gap-2 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Post Item
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}