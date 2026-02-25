import { apiFetch } from "./client";

/**
 * GET worker bookings (Standard)
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
 * ✅ GET /api/worker-services/my-bookings
 * Resident-specific fetch that includes merged payment/refund data
 */
export function fetchMyWorkerBookings() {
  return apiFetch("/api/worker-services/my-bookings");
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

/**
 * ✅ POST /api/refunds/worker/request
 * Resident requests a refund for a worker service payment
 */
export function requestWorkerRefund(paymentId, reason = "Service not needed") {
  return apiFetch("/api/refunds/worker/request", {
    method: "POST",
    body: JSON.stringify({ payment_id: paymentId, reason }),
  });
}