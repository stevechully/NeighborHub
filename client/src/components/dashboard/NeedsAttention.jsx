import { AlertCircle } from "lucide-react";

export default function NeedsAttention() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">

      <AlertCircle className="text-yellow-600" size={20} />

      <div>
        <p className="font-medium text-yellow-800">
          Attention Needed
        </p>

        <p className="text-sm text-yellow-700">
          You have 1 pending payment and 1 complaint update.
        </p>
      </div>

    </div>
  );
}