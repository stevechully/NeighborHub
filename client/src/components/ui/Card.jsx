import React from "react";

export default function Card({ children, className = "", noHover = false }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm 
        ${!noHover ? "hover:shadow-md transition-shadow duration-200" : ""} 
        ${className}`}
    >
      {children}
    </div>
  );
}