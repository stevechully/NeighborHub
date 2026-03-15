export default function NoticeCard({ notice, isAdmin, onDelete, onOpen }) {
  const priorityColor = {
    LOW: "bg-green-100 text-green-700",
    NORMAL: "bg-blue-100 text-blue-700",
    HIGH: "bg-red-100 text-red-700",
    URGENT: "bg-red-200 text-red-800",
    CRITICAL: "bg-red-200 text-red-800"
  };

  // Safely handle depending on what your database column is named
  const textContent = notice.content || notice.message;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-slate-800">
          {notice.title}
        </h3>

        <div className="flex items-center gap-3">
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wider ${priorityColor[notice.priority] || priorityColor.NORMAL}`}>
            {notice.priority}
          </span>
          
          {/* Admin Delete Button */}
          {isAdmin && onDelete && (
            <button 
              onClick={onDelete}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Message (Truncated to 3 lines!) */}
      <p className="text-sm text-slate-600 mt-3 line-clamp-3">
        {textContent}
      </p>

      {/* Read More Trigger */}
      <button
        onClick={() => onOpen(notice)}
        className="mt-3 text-indigo-600 text-sm font-semibold hover:text-indigo-800 hover:underline transition-all"
      >
        Read Full Notice →
      </button>

      {/* Metadata */}
      <div className="text-[11px] text-slate-400 flex gap-3 flex-wrap mt-4 pt-3 border-t border-slate-50">
        <span>Target: <b>{notice.target}</b></span>
        <span>Posted: {new Date(notice.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>

    </div>
  );
}