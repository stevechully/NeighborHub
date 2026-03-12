import { useEffect } from "react";
import { fetchComplaints } from "../../api/complaints.api";
import { useAuth } from "../../auth/AuthContext";
import { sidebarMenu } from "../../config/sidebarMenu"; // ✅ Import config

// New UI Components
import GreetingBanner from "../../components/dashboard/GreetingBanner";
import NeedsAttention from "../../components/dashboard/NeedsAttention";
import QuickAccessCard from "../../components/dashboard/QuickAccessCard";
import ActivityFeed from "../../components/dashboard/ActivityFeed";

// Icons
import {
  MessageSquare, Wrench, Package, ShoppingCart, Calendar, 
  Building, ClipboardList, ShieldCheck, Wallet, Settings
} from "lucide-react";

// Helper to auto-assign icons for Dashboard Cards
const getCardIcon = (path) => {
  if (path.includes("notices")) return <ClipboardList className="w-5 h-5 text-indigo-600" />;
  if (path.includes("complaints")) return <MessageSquare className="w-5 h-5 text-indigo-600" />;
  if (path.includes("worker-services")) return <Wrench className="w-5 h-5 text-indigo-600" />;
  if (path.includes("maintenance")) return <Settings className="w-5 h-5 text-indigo-600" />;
  if (path.includes("events")) return <Calendar className="w-5 h-5 text-indigo-600" />;
  if (path.includes("marketplace")) return <ShoppingCart className="w-5 h-5 text-indigo-600" />;
  if (path.includes("facilities")) return <Building className="w-5 h-5 text-indigo-600" />;
  if (path.includes("parcels")) return <Package className="w-5 h-5 text-indigo-600" />;
  if (path.includes("gate")) return <ShieldCheck className="w-5 h-5 text-blue-600" />;
  if (path.includes("refunds")) return <Wallet className="w-5 h-5 text-green-600" />;
  return <MessageSquare className="w-5 h-5 text-indigo-600" />;
};

export default function Dashboard() {
  const { profile } = useAuth();

  // Role detection logic
  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || "RESIDENT";

  // Fetch menu array and filter out the "Dashboard" link itself
  const quickAccessItems = (sidebarMenu[roleName] || sidebarMenu.RESIDENT).filter(
    (item) => item.path !== "/dashboard"
  );

  useEffect(() => {
    async function test() {
      try {
        await fetchComplaints();
      } catch (err) {
        console.error("Complaints fetch failed:", err.message);
      }
    }
    test();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Greeting & Hero Section */}
      <GreetingBanner 
        user={profile?.full_name || "Resident"} 
        role={roleName} 
      />

      {/* 2. Important Notifications / Alerts */}
      <NeedsAttention />

      {/* 3. Dynamic Quick Access Grid */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-800 px-1">
          Quick Access
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* ✅ Dynamically mapped from sidebarMenu.js */}
          {quickAccessItems.map((item) => (
            <QuickAccessCard
              key={item.path}
              title={item.name}
              icon={getCardIcon(item.path)}
              link={item.path}
            />
          ))}
        </div>
      </div>

      {/* 4. Detailed Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-slate-800">
            Upcoming Events
          </h3>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Calendar className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">
              No community events scheduled for this week.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}