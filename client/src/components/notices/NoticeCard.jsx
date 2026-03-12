export default function NoticeCard({ notice }) {

    const priorityColor = {
      LOW: "bg-gray-100 text-gray-600",
      NORMAL: "bg-blue-100 text-blue-700",
      HIGH: "bg-red-100 text-red-700",
      CRITICAL: "bg-red-200 text-red-800"
    };
  
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
  
        {/* Header */}
  
        <div className="flex justify-between items-start mb-2">
  
          <h3 className="text-lg font-semibold text-slate-800">
            {notice.title}
          </h3>
  
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              priorityColor[notice.priority] || priorityColor.NORMAL
            }`}
          >
            {notice.priority}
          </span>
  
        </div>
  
        {/* Message */}
  
        <p className="text-sm text-slate-600 mb-3">
          {notice.message}
        </p>
  
        {/* Metadata */}
  
        <div className="text-xs text-slate-400 flex gap-3 flex-wrap">
  
          <span>
            Target: <b>{notice.target}</b>
          </span>
  
          <span>
            Posted: {new Date(notice.created_at).toLocaleString()}
          </span>
  
        </div>
  
      </div>
    );
  }