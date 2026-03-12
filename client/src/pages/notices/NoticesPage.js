import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { createNotice, deleteNotice, fetchNotices } from "../../api/notices.api";

// ✅ Added Import
import NoticeCard from "../../components/notices/NoticeCard";

export default function NoticesPage() {
  const { profile, loading: authLoading } = useAuth();

  const roleName =
    profile?.roles?.name || profile?.role || profile?.user_roles?.role || null;

  const isAdmin = roleName === "ADMIN";

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // eslint-disable-next-line
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
      alert("Notice deleted ✅");
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
      
      {/* ✅ REPLACED: Modern Page Header */}
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

      {/* ✅ REPLACED: NOTICE LIST */}
      <div>
        {loading ? (
          <p className="text-slate-500 py-10 text-center">Loading notices...</p>
        ) : notices.length === 0 ? (
          <p className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No active notices.
          </p>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                isAdmin={isAdmin}
                onDelete={() => handleDeleteNotice(notice.id)} // Passed down in case the card handles deletion!
              />
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}