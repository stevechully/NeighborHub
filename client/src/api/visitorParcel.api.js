import { apiFetch } from "./client";

/* -------- Visitors -------- */

export function fetchVisitors() {
  return apiFetch("/api/visitors");
}

export function createVisitor(payload) {
  return apiFetch("/api/visitors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function markVisitorExit(id) {
  return apiFetch(`/api/visitors/${id}/exit`, {
    method: "PATCH",
  });
}

/* -------- Parcels -------- */

export function fetchParcels() {
  return apiFetch("/api/parcels");
}

export function createParcel(payload) {
  return apiFetch("/api/parcels", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function markParcelPickedUp(id) {
  return apiFetch(`/api/parcels/${id}/pickup`, {
    method: "PATCH",
  });
}
