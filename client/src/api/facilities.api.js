import { apiFetch } from "./client";

/**
 * GET /api/facilities
 * All roles can view facilities (Filtered by is_active in backend)
 */
export function fetchFacilities() {
  return apiFetch("/api/facilities");
}

/**
 * POST /api/facilities
 * Admin creates a facility
 */
export function createFacility(payload) {
  return apiFetch("/api/facilities", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /api/facilities/:id
 * Admin updates a facility
 */
export function updateFacility(facilityId, payload) {
  return apiFetch(`/api/facilities/${facilityId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/facilities/:id/deactivate
 * Admin deactivates a facility
 */
export function deactivateFacility(facilityId) {
  return apiFetch(`/api/facilities/${facilityId}/deactivate`, {
    method: "PATCH",
  });
}

/**
 * POST /api/facilities/:id/book
 * Resident books a facility
 */
export function bookFacility(facilityId, payload) {
  return apiFetch(`/api/facilities/${facilityId}/book`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/facilities/bookings
 */
export function fetchFacilityBookings() {
  return apiFetch("/api/facilities/bookings");
}

/**
 * PATCH /api/facilities/bookings/:id
 * Admin ONLY generic status update (Approvals)
 */
export function updateFacilityBookingStatus(bookingId, status) {
  return apiFetch(`/api/facilities/bookings/${bookingId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/**
 * ✅ NEW: PATCH /api/facilities/bookings/:id/cancel
 * Logic for BOTH Residents and Admins to cancel
 */
export function cancelFacilityBooking(bookingId) {
  return apiFetch(`/api/facilities/bookings/${bookingId}/cancel`, {
    method: "PATCH",
  });
}

/**
 * POST /api/facilities/bookings/:id/pay
 */
export function payForFacilityBooking(bookingId, payment_method) {
  return apiFetch(`/api/facilities/bookings/${bookingId}/pay`, {
    method: "POST",
    body: JSON.stringify({ payment_method }),
  });
}

/**
 * GET /api/facilities/:id/bookings?date=YYYY-MM-DD
 */
export function fetchFacilityBookingsByDate(facilityId, date) {
  return apiFetch(`/api/facilities/${facilityId}/bookings?date=${date}`);
}