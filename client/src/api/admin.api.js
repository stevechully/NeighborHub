import { apiFetch } from "./client";

/**
 * ADMIN: Fetch all active workers
 */
export function fetchWorkers() {
  return apiFetch("/api/admin/workers");
}

/**
 * ✅ NEW - ADMIN/SECURITY: Fetch active residents for dropdowns
 * Matches backend: GET /api/admin/residents
 */
export function fetchResidents() {
  return apiFetch("/api/admin/residents");
}

/**
 * ADMIN: Update user role or status
 */
export function updateUserRoleStatus(userId, payload) {
  return apiFetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}