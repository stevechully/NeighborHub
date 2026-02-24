import { apiFetch } from "./client";

/**
 * GET worker bookings
 * - Resident/Worker: uses default RLS endpoint
 * - Admin: uses admin endpoint to bypass RLS
 */
export function fetchWorkerBookings(filters = {}, isAdmin = false) {
  const cleanFilters = {};
  if (filters.status) {
    cleanFilters.status = filters.status;
  }

  const params = new URLSearchParams(cleanFilters).toString();

  const baseUrl = isAdmin
    ? "/api/worker-services/admin/all"
    : "/api/worker-services";

  return apiFetch(`${baseUrl}${params ? `?${params}` : ""}`);
}

/**
 * POST /api/worker-services
 * Resident creates booking
 */
export function createWorkerBooking(payload) {
  return apiFetch("/api/worker-services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/worker-services/:id/assign
 * Admin assigns worker
 */
export function assignWorkerToBooking(id, worker_id) {
  return apiFetch(`/api/worker-services/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ worker_id }),
  });
}

/**
 * PATCH /api/worker-services/:id/status
 * Worker updates booking status
 */
export function updateWorkerBookingStatus(id, status) {
  return apiFetch(`/api/worker-services/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/**
 * POST /api/worker-services/:id/pay
 * Resident pays for a completed service
 */
export function payForWorkerService(id, payload) {
  return apiFetch(`/api/worker-services/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}