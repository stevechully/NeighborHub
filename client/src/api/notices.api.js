import { apiFetch } from "./client";

// GET /api/notices (all users)
export function fetchNotices() {
  return apiFetch("/api/notices");
}

// POST /api/notices (ADMIN)
export function createNotice(payload) {
  return apiFetch("/api/notices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// DELETE /api/notices/:id (ADMIN)
export function deleteNotice(id) {
  return apiFetch(`/api/notices/${id}`, {
    method: "DELETE",
  });
}
