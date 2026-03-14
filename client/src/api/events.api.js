import { apiFetch } from "./client";

export function fetchEvents() {
  return apiFetch("/api/events");
}

export function createEvent(payload) {
  return apiFetch("/api/events", { method: "POST", body: JSON.stringify(payload) });
}

export function registerForEvent(eventId) {
  return apiFetch(`/api/events/${eventId}/register`, { method: "POST" });
}

export function deleteEvent(eventId) {
  return apiFetch(`/api/events/${eventId}`, { method: "DELETE" });
}

export function cancelEventRegistration(registrationId) {
  return apiFetch(`/api/events/my/${registrationId}/cancel`, { method: "PATCH" });
}

/**
 * ✅ UPDATED: Call the correct event refund endpoint
 */
/**
 * ✅ FIXED: Now points to the Global Refund Engine!
 * POST /api/refunds/event/request
 */
export function requestEventRefund(paymentId, reason = "Resident request") {
  return apiFetch("/api/refunds/event/request", {
    method: "POST",
    body: JSON.stringify({ 
      payment_id: paymentId, 
      reason: reason 
    }),
  });
}