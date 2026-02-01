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

// POST /api/events/:id/join (RESIDENT)
export function joinEvent(eventId) {
  return apiFetch(`/api/events/${eventId}/join`, {
    method: "POST",
  });
}

// DELETE /api/events/:id (ADMIN)
export function deleteEvent(eventId) {
  return apiFetch(`/api/events/${eventId}`, {
    method: "DELETE",
  });
}
