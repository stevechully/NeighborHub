import { useState } from "react";

export default function RaiseComplaintModal({ open, onClose, onSubmit }) {

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ title, description: desc });
    setTitle("");
    setDesc("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-xl p-6 w-[400px]">

        <h2 className="text-lg font-semibold mb-4">
          Raise Complaint
        </h2>

        <form onSubmit={submit} className="space-y-3">

          <input
            placeholder="Title"
            className="w-full border rounded-lg p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description"
            className="w-full border rounded-lg p-2 h-24"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <div className="flex justify-end gap-2">

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
              Submit
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}