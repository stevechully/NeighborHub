import { apiFetch } from "./client";

// GET /api/events (all users)
export function fetchEvents() {
  return apiFetch("/api/events");
}

// POST /api/events (ADMIN)
export function createEvent(payload) {
  return apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// POST /api/events/:id/register (RESIDENT)
export function registerForEvent(eventId) {
  return apiFetch(`/api/events/${eventId}/register`, {
    method: "POST",
  });
}

// POST /api/events/:id/pay (RESIDENT)
export function payForEvent(eventId, payload) {
  return apiFetch(`/api/events/${eventId}/pay`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// DELETE /api/events/:id (ADMIN)
export function deleteEvent(eventId) {
  return apiFetch(`/api/events/${eventId}`, {
    method: "DELETE",
  });
}

/**
 * ✅ NEW: POST /api/refunds/event/request
 * Resident requests a refund for an event
 */
export function requestEventRefund(paymentId, reason = "Resident request") {
  return apiFetch("/api/refunds/event/request", {
    method: "POST",
    body: JSON.stringify({ payment_id: paymentId, reason }),
  });
}