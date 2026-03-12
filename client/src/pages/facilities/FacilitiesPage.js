import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { fetchFacilities } from "../../api/facilities.api";

// ✅ New Component Import
import FacilityCard from "../../components/facilities/FacilityCard";

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isResident = roleName === "RESIDENT";

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadFacilities() {
    try {
      setLoading(true);
      const data = await fetchFacilities();
      setFacilities(data || []);
    } catch (err) {
      console.log("❌ Facilities fetch failed:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && profile) {
      loadFacilities();
    }
    // eslint-disable-next-line
  }, [authLoading, profile]);

  if (authLoading || !profile) {
    return (
      <div className="p-10 flex justify-center items-center">
        <p className="text-slate-500 font-medium animate-pulse">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Page Header (Updated with Tailwind) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Facilities</h2>
          <p className="text-sm text-slate-500 mt-1">Book and manage community amenities</p>
        </div>

        <button 
          onClick={() => navigate("/facilities/bookings")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          My Bookings
        </button>
      </div>

      {/* Facilities Grid Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {loading ? (
          <p className="text-slate-500 py-8 text-center">Loading facilities...</p>
        ) : facilities.length === 0 ? (
          <p className="text-slate-500 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No facilities available.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* ✅ Replaced inline HTML with the new FacilityCard */}
            {facilities.map((f) => (
              <FacilityCard 
                key={f.id} 
                facility={f} 
                isResident={isResident} 
                onBook={() => navigate(`/facilities/${f.id}`)}
              />
            ))}
            
          </div>
        )}
      </div>

    </div>
  );
}