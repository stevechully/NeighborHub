import { useState } from "react";

export default function RaiseComplaintModal({ open, onClose, onSubmit }) {

  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [desc, setDesc] = useState("");

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();

    if (!category || !desc) {
      alert("Please fill all fields");
      return;
    }

    onSubmit({
      category,
      description: desc,
      priority
    });

    setCategory("");
    setPriority("MEDIUM");
    setDesc("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-xl p-6 w-[420px]">

        <h2 className="text-lg font-semibold mb-4">
          Raise Complaint
        </h2>

        <form onSubmit={submit} className="space-y-3">

          {/* Category */}
          <select
            className="w-full border rounded-lg p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="SECURITY">Security</option>
            <option value="CLEANING">Cleaning</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Priority */}
          <select
            className="w-full border rounded-lg p-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Description */}
          <textarea
            placeholder="Describe the issue..."
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