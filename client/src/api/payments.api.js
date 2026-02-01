import { apiFetch } from "./client";

/**
 * RESIDENT: Mock payment
 * POST /api/payments/mock
 */
export function mockPayInvoice(payload) {
  return apiFetch("/api/payments/mock", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * RESIDENT: My payments
 * GET /api/payments/my
 */
export function fetchMyPayments() {
  return apiFetch("/api/payments/my");
}

/**
 * ADMIN: All payments
 * GET /api/payments
 */
export function fetchAllPayments() {
  return apiFetch("/api/payments");
}

/**
 * Printable receipt data
 * GET /api/payments/:id/receipt
 */
export function fetchPaymentReceipt(paymentId) {
  return apiFetch(`/api/payments/${paymentId}/receipt`);
}
