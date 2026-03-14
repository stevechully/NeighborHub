import { apiFetch } from "./client";

/**
 * 🟢 UNIVERSAL: Confirm any payment (Events, Facilities, etc.)
 * POST /api/payments/confirm
 */
export function confirmPayment(module, referenceId, amount, method) {
  return apiFetch("/api/payments/confirm", {
    method: "POST",
    body: JSON.stringify({
      module,
      reference_id: referenceId,
      amount,
      payment_method: method
    }),
  });
}

/**
 * 🟡 RESIDENT: Mock payment (Legacy Maintenance Flow)
 * POST /api/payments/mock
 */
export function mockPayInvoice(payload) {
  return apiFetch("/api/payments/mock", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 🔵 RESIDENT: Fetch user's own payments
 * GET /api/payments/my
 */
export function fetchMyPayments() {
  return apiFetch("/api/payments/my");
}

/**
 * 🟣 ADMIN: Fetch all community payments
 * GET /api/payments
 */
export function fetchAllPayments() {
  return apiFetch("/api/payments");
}

/**
 * ⚪ PRINT: Fetch receipt data
 * GET /api/payments/:id/receipt
 */
export function fetchPaymentReceipt(paymentId) {
  return apiFetch(`/api/payments/${paymentId}/receipt`);
}