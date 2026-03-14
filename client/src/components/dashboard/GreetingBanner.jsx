export default function GreetingBanner({ user, role }) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-8 border border-indigo-100/50 shadow-sm relative overflow-hidden">
      
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Welcome back, {user} <span className="inline-block animate-wave origin-bottom-right">👋</span>
        </h1>
  
        <p className="text-slate-500 mt-2 font-medium">
          {role === "ADMIN" || role === "SECURITY" 
            ? `Community ${role.charAt(0) + role.slice(1).toLowerCase()} Dashboard`
            : "Smart Community Dashboard"
          }
        </p>
      </div>

    </div>
  );
}