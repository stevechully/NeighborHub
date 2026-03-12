import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || "Resident";
  const fullName = profile?.full_name || "User";

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      
      {/* Left side: Brand */}
      <div className="font-bold text-xl text-indigo-600 tracking-tight">
        NeighborHub
      </div>

      {/* Right side: User Profile & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* User Info (Hidden on very small mobile screens) */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-700 leading-tight">
            {fullName}
          </p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {roleName}
          </p>
        </div>
        
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200 shrink-0">
          {fullName.charAt(0).toUpperCase()}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>

        {/* ✅ Always Visible Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-red-100 shrink-0"
        >
          Logout
        </button>

      </div>
    </header>
  );
}