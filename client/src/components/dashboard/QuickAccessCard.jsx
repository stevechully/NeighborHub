import { Link } from "react-router-dom";

export default function QuickAccessCard({ icon, title, link }) {
  return (
    <Link
      to={link}
      className="bg-white border rounded-xl p-5 hover:shadow-md transition flex items-center gap-4"
    >
      <div className="text-indigo-600">
        {icon}
      </div>

      <div>
        <p className="font-medium">{title}</p>
      </div>
    </Link>
  );
}