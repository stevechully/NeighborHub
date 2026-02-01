import { apiFetch } from "./client";

/**
 * GET /api/facilities
 * All roles can view facilities
 */
export function fetchFacilities() {
  return apiFetch("/api/facilities");
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
 * RLS decides visibility
 * - Resident: own bookings
 * - Admin: all bookings
 */
export function fetchFacilityBookings() {
  return apiFetch("/api/facilities/bookings");
}

/**
 * PATCH /api/facilities/bookings/:id
 * Admin approves/cancels booking
 */
export function updateFacilityBookingStatus(bookingId, status) {
  return apiFetch(`/api/facilities/bookings/${bookingId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
