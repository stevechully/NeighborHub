import { apiFetch } from "./client";

/**
 * GET /api/admin/residents
 * Security/Admin fetch residents list
 */
export function fetchResidents() {
  return apiFetch("/api/admin/residents");
}
