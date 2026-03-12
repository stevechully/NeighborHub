import React from "react";

export default function Badge({ children, type = "default", className = "" }) {
  const styles = {
    success: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    danger: "bg-red-100 text-red-700 border-red-200",
    info: "bg-indigo-100 text-indigo-700 border-indigo-200",
    default: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span 
      className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider border ${styles[type]} ${className}`}
    >
      {children}
    </span>
  );
}