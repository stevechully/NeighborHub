import { apiFetch } from "./client";

/* PRODUCTS */
export function fetchMarketplaceProducts() {
  return apiFetch("/api/marketplace/products");
}

export function fetchAllMarketplaceProducts() {
  return apiFetch("/api/marketplace/products/all"); 
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

/**
 * ✅ For Residents: Fetch their own orders merged with payment/refund data
 */
export function fetchMyMarketplaceOrders() {
  return apiFetch("/api/marketplace/my-orders");
}

/**
 * ✅ For Admins: Fetch ALL orders 
 * (Renamed to match fetchAllMarketplaceProducts)
 */
export function fetchAllMarketplaceOrders() {
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

/**
 * ✅ FIXED: Aligned exactly with the backend refund route we created
 * POST /api/marketplace/payments/:id/refund
 */
/**
 * ✅ FIXED: Pointing back to the global refunds router so Admins can see it!
 */
export function requestMarketplaceRefund(paymentId, reason = "Product issue") {
  return apiFetch("/api/refunds/marketplace/request", {
    method: "POST",
    body: JSON.stringify({ payment_id: paymentId, reason }),
  });
}

export function approveMarketplaceRefund(paymentId) {
  return apiFetch(`/api/marketplace/payments/${paymentId}/refund/approve`, {
    method: "POST",
  });
}