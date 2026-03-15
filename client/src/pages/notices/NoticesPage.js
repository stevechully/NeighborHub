import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { createNotice, deleteNotice, fetchNotices } from "../../api/notices.api";
import NoticeCard from "../../components/notices/NoticeCard";

// ✅ The New Modal Component (Placed right here for convenience)
function NoticeModal({ notice, onClose }) {
  if (!notice) return null;
  const textContent = notice.content || notice.message;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-slate-800 pr-8">
            {notice.title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 tracking-wider">
            {notice.priority}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {new Date(notice.created_at).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
          </span>
        </div>

        {/* whitespace-pre-line is the magic trick that preserves their paragraphs! */}
        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          {textContent}
        </div>
      </div>
    </div>
  );
}

export default function NoticesPage() {
  const { profile, loading: authLoading } = useAuth();

  const roleName = profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;
  const isAdmin = roleName === "ADMIN";

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ New State to track which notice is currently open in the modal
  const [selectedNotice, setSelectedNotice] = useState(null);

  // create notice form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [target, setTarget] = useState("ALL");
  const [expiresAt, setExpiresAt] = useState("");

  async function loadNotices() {
    try {
      setLoading(true);
      const data = await fetchNotices();
      setNotices(data || []);
    } catch (err) {
      console.log("❌ Notices fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && profile) {
      loadNotices();
    }
  }, [authLoading, profile]);

  async function handleCreateNotice(e) {
    e.preventDefault();

    if (!title || !content || !priority || !target) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await createNotice({
        title,
        content,
        priority,
        target,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      setTitle("");
      setContent("");
      setPriority("NORMAL");
      setTarget("ALL");
      setExpiresAt("");

      await loadNotices();
      alert("Notice created ✅");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteNotice(id) {
    if (!window.confirm("Delete this notice?")) return;

    try {
      await deleteNotice(id);
      await loadNotices();
    } catch (err) {
      alert(err.message);
    }
  }

  if (authLoading || !profile) {
    return (
      <div className="p-10 flex justify-center items-center">
        <p className="text-slate-500 font-medium animate-pulse">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Notice Board
          </h1>
          <p className="text-sm text-slate-500 mt-1">Stay updated with community announcements</p>
        </div>

        <button
          onClick={loadNotices}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          Refresh
        </button>
      </div>

      {/* ADMIN CREATE NOTICE */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Create Notice (Admin)</h3>

          <form onSubmit={handleCreateNotice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Announcement Title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="What do residents need to know?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="ALL">ALL</option>
                  <option value="RESIDENT">RESIDENTS</option>
                  <option value="WORKER">WORKERS</option>
                  <option value="ADMIN">ADMINS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
            >
              Post Notice
            </button>
          </form>
        </div>
      )}

      {/* NOTICE LIST */}
      <div>
        {loading ? (
          <p className="text-slate-500 py-10 text-center">Loading notices...</p>
        ) : notices.length === 0 ? (
          <p className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No active notices.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                isAdmin={isAdmin}
                onDelete={() => handleDeleteNotice(notice.id)}
                onOpen={setSelectedNotice} // ✅ Passes the notice to the modal state
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ The Modal Renderer */}
      <NoticeModal 
        notice={selectedNotice} 
        onClose={() => setSelectedNotice(null)} 
      />
      
    </div>
  );
}