import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { createNotice, deleteNotice, fetchNotices } from "../../api/notices.api";

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
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Verifying session...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Notice Board</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={loadNotices}>Refresh</button>
      </div>

      {/* ADMIN CREATE NOTICE */}
      {isAdmin && (
        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <h3>Create Notice (Admin)</h3>

          <form onSubmit={handleCreateNotice}>
            <div style={{ marginBottom: 10 }}>
              <label>Title</label>
              <br />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Content</label>
              <br />
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <div>
                <label>Priority</label>
                <br />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label>Target</label>
                <br />
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="ALL">ALL</option>
                  <option value="RESIDENT">RESIDENT</option>
                  <option value="WORKER">WORKER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label>Expires At (optional)</label>
                <br />
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <button type="submit">Create Notice</button>
          </form>
        </div>
      )}

      {/* NOTICE LIST */}
      <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
        <h3>Notices</h3>

        {loading ? (
          <p>Loading notices...</p>
        ) : notices.length === 0 ? (
          <p>No notices found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notices.map((n) => (
              <div
                key={n.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <h4 style={{ margin: 0 }}>{n.title}</h4>
                  <span style={{ fontWeight: "bold" }}>{n.priority}</span>
                </div>

                <p style={{ marginTop: 8 }}>{n.content}</p>

                <small style={{ color: "#666" }}>
                  Target: {n.target} | Created: {new Date(n.created_at).toLocaleString()}
                </small>

                {isAdmin && (
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => handleDeleteNotice(n.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
