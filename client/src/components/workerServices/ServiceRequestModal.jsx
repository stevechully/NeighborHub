import { useState } from "react";

export default function ServiceRequestModal({ open, onClose, onSubmit }) {

  const [category, setCategory] = useState("PLUMBER");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ category, description, preferred_date: date });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-xl p-6 w-[420px]">

        <h2 className="text-lg font-semibold mb-4">
          Request Worker Service
        </h2>

        <form onSubmit={submit} className="space-y-3">

          <select
            className="w-full border rounded-lg p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="PLUMBER">Plumber</option>
            <option value="CLEANER">Cleaner</option>
            <option value="ELECTRICIAN">Electrician</option>
            <option value="CABLE_OPERATOR">Cable Operator</option>
          </select>

          <textarea
            placeholder="Describe the issue"
            className="w-full border rounded-lg p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="datetime-local"
            className="w-full border rounded-lg p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="flex justify-end gap-2">

            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              Request
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}