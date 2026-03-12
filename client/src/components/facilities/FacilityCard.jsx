import { Users, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FacilityCard({ facility }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">

      <div>
        <h3 className="text-lg font-semibold">
          {facility.name}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          {facility.description}
        </p>

        <div className="flex gap-4 mt-3 text-sm text-gray-600">

          {facility.capacity && (
            <div className="flex items-center gap-1">
              <Users size={16} />
              {facility.capacity}
            </div>
          )}

          {facility.price_per_slot && (
            <div className="flex items-center gap-1">
              <IndianRupee size={16} />
              {facility.price_per_slot}
            </div>
          )}

        </div>
      </div>

      <button
        onClick={() => navigate(`/facilities/${facility.id}`)}
        className="mt-5 bg-indigo-600 text-white py-2 rounded-lg"
      >
        View Slots
      </button>

    </div>
  );
}