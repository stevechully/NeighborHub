import { apiFetch } from "./client";

export function fetchComplaints(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/api/complaints${params ? `?${params}` : ""}`);
}

export function createComplaint(payload) {
  return apiFetch("/api/complaints", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function assignWorkerToComplaint(id, worker_id) {
  return apiFetch(`/api/complaints/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ worker_id }),
  });
}

export function updateComplaintStatus(id, status) {
  return apiFetch(`/api/complaints/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function closeComplaint(id) {
  return apiFetch(`/api/complaints/${id}/close`, {
    method: "PATCH",
  });
}
