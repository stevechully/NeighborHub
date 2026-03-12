import React from "react";

export default function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  className = "",
  type = "button"
}) {
  const styles = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm",
    secondary: "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 
        ${styles[variant]} 
        ${disabled ? "opacity-50 cursor-not-allowed active:scale-100" : "active:scale-95"} 
        ${className}`}
    >
      {children}
    </button>
  );
}