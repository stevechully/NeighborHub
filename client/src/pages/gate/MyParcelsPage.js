import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { fetchVisitors, fetchParcels } from "../../api/visitorParcel.api";
import useParcelNotifications from "../../hooks/useParcelNotifications"; 

// ✅ Added Card Imports
import VisitorCard from "../../components/gate/VisitorCard";
import ParcelCard from "../../components/gate/ParcelCard";

export default function MyParcelsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = profile?.id; 
  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isResident = roleName === "RESIDENT";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Attempt to fetch visitors safely
      const vData = await fetchVisitors().catch((err) => {
        console.log("❌ Visitors fetch failed (likely RLS):", err.message);
        return []; // Return empty array on fail
      });

      // Attempt to fetch parcels safely
      const pData = await fetchParcels().catch((err) => {
        console.log("❌ Parcels fetch failed:", err.message);
        return [];
      });

      setVisitors(vData || []);
      setParcels(pData || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const onNewParcel = useCallback((parcel) => {
    alert(`📦 New parcel received from ${parcel.courier_name}!`);
    loadData(); 
  }, [loadData]);

  useParcelNotifications(userId, onNewParcel);

  useEffect(() => {
    if (!authLoading && profile) loadData();
  }, [authLoading, profile, loadData]);

  if (authLoading || !profile) {
    return (
      <div className="p-10 flex justify-center items-center">
        <p className="text-slate-500 font-medium animate-pulse">Verifying session...</p>
      </div>
    );
  }

  if (!isResident) {
    return (
      <div className="p-10 text-center">
        <h3 className="text-xl font-bold text-red-600 mb-2">🚫 Access Denied</h3>
        <p className="text-slate-600">This page is for residents only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      {/* ✅ Improved Page Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Gate Activity</h2>
          <p className="text-sm text-slate-500 mt-1">Track your visitors and incoming parcels</p>
        </div>

        <button
          onClick={loadData}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          Refresh
        </button>
      </div>

      {/* VISITORS SECTION */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          My Visitors
        </h2>
        {loading ? (
          <p className="text-slate-500 py-10 text-center">Loading visitors...</p>
        ) : visitors.length === 0 ? (
          <p className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No visitors found.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visitors.map((v) => (
              <VisitorCard
                key={v.id}
                visitor={v}
              />
            ))}
          </div>
        )}
      </div>

      {/* PARCELS SECTION */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          My Parcels
        </h2>
        {loading ? (
          <p className="text-slate-500 py-10 text-center">Loading parcels...</p>
        ) : parcels.length === 0 ? (
          <p className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No parcels found.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parcels.map((p) => (
              <ParcelCard
                key={p.id}
                parcel={p}
              />
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}