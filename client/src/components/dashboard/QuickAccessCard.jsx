import { Link } from "react-router-dom";

export default function QuickAccessCard({ icon, title, link }) {
  return (
    <Link
      to={link}
      className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center h-32"
    >
      <div className="text-slate-400 group-hover:text-indigo-600 transition-colors duration-300 transform group-hover:scale-110">
        {icon}
      </div>

      <p className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
        {title}
      </p>
    </Link>
  );
}