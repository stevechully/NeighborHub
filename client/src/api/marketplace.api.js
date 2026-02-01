import { apiFetch } from "./client";

/* PRODUCTS */
export function fetchMarketplaceProducts() {
  return apiFetch("/api/marketplace/products");
}

export function fetchAllMarketplaceProducts() {
  return apiFetch("/api/marketplace/products/all"); 
  // (We'll add this route below if you don't have it)
}

export function createMarketplaceProduct(payload) {
  return apiFetch("/api/marketplace/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveMarketplaceProduct(id) {
  return apiFetch(`/api/marketplace/products/${id}/approve`, {
    method: "PATCH",
  });
}

/* ORDERS */
export function placeMarketplaceOrder(payload) {
  return apiFetch("/api/marketplace/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMarketplaceOrders() {
  return apiFetch("/api/marketplace/orders");
}

/* PAYMENTS */
export function payMarketplaceOrder(orderId, payload) {
  return apiFetch(`/api/marketplace/orders/${orderId}/pay`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMyMarketplacePayments() {
  return apiFetch("/api/marketplace/payments/my");
}

export function fetchAllMarketplacePayments() {
  return apiFetch("/api/marketplace/payments");
}

export function fetchMarketplacePaymentReceipt(paymentId) {
  return apiFetch(`/api/marketplace/payments/${paymentId}/receipt`);
}
