import { apiFetch } from "./client";

export function fetchAllSellers() {
  return apiFetch("/api/marketplace/sellers");
}

export function approveSeller(sellerId) {
  return apiFetch(`/api/marketplace/sellers/${sellerId}/approve`, {
    method: "PATCH",
  });
}
