import { useEffect } from "react";
import { fetchComplaints } from "../../api/complaints.api";
import { useAuth } from "../../auth/AuthContext";
import { sidebarMenu } from "../../config/sidebarMenu"; 

// UI Components
import GreetingBanner from "../../components/dashboard/GreetingBanner";
import QuickAccessCard from "../../components/dashboard/QuickAccessCard";

// Icons
import {
  MessageSquare, Wrench, Package, ShoppingCart, Calendar, 
  Building, ClipboardList, ShieldCheck, Wallet, Settings
} from "lucide-react";

// Helper to auto-assign icons for Dashboard Cards
const getCardIcon = (path) => {
  if (path.includes("notices")) return <ClipboardList className="w-5 h-5" />;
  if (path.includes("complaints")) return <MessageSquare className="w-5 h-5" />;
  if (path.includes("worker-services")) return <Wrench className="w-5 h-5" />;
  if (path.includes("maintenance")) return <Settings className="w-5 h-5" />;
  if (path.includes("events")) return <Calendar className="w-5 h-5" />;
  if (path.includes("marketplace")) return <ShoppingCart className="w-5 h-5" />;
  if (path.includes("facilities")) return <Building className="w-5 h-5" />;
  if (path.includes("parcels")) return <Package className="w-5 h-5" />;
  if (path.includes("gate")) return <ShieldCheck className="w-5 h-5" />;
  if (path.includes("refunds")) return <Wallet className="w-5 h-5" />;
  return <MessageSquare className="w-5 h-5" />;
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
    async function initDashboard() {
      try {
        await fetchComplaints();
      } catch (err) {
        console.error("Dashboard init failed:", err.message);
      }
    }
    initDashboard();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Greeting & Hero Section */}
      <GreetingBanner 
        user={profile?.full_name || "Resident"} 
        role={roleName} 
      />

      {/* 2. Dynamic Quick Access Grid */}
      <div className="pt-2">
        <h3 className="text-lg font-bold mb-5 text-slate-800 tracking-tight">
          Quick Access
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
      
    </div>
  );
}