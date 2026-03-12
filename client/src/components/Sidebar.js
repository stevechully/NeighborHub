import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { sidebarMenu } from "../../config/sidebarMenu";
import {
  Home, Bell, MessageSquare, Wrench, Settings, Calendar,
  ShoppingCart, Building, Package, ShieldCheck, Wallet
} from "lucide-react";

// Helper to auto-assign icons based on the path
const getIcon = (path) => {
  if (path.includes("dashboard")) return <Home size={18} />;
  if (path.includes("notices")) return <Bell size={18} />;
  if (path.includes("complaints")) return <MessageSquare size={18} />;
  if (path.includes("worker-services")) return <Wrench size={18} />;
  if (path.includes("maintenance")) return <Settings size={18} />;
  if (path.includes("events")) return <Calendar size={18} />;
  if (path.includes("marketplace")) return <ShoppingCart size={18} />;
  if (path.includes("facilities")) return <Building size={18} />;
  if (path.includes("parcels")) return <Package size={18} />;
  if (path.includes("gate")) return <ShieldCheck size={18} />;
  if (path.includes("refunds")) return <Wallet size={18} />;
  return <Home size={18} />; // fallback
};

export default function Sidebar() {
  const { profile } = useAuth();

  // Role detection with fallback to RESIDENT
  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || "RESIDENT";
  
  // Fetch menu array from config
  const menuItems = sidebarMenu[roleName] || sidebarMenu.RESIDENT;

  return (
    <aside className="w-64 bg-white border-r flex flex-col shrink-0">

      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <h1 className="font-bold text-lg text-indigo-600 tracking-tight">NeighborHub</h1>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Smart Community</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mt-2 mb-3">
          Main Menu
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {getIcon(item.path)}
            {item.name}
          </NavLink>
        ))}

      </nav>

    </aside>
  );
}