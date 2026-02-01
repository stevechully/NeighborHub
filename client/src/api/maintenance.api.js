import { apiFetch } from "./client";

/**
 * ADMIN: Generate invoices for all residents
 * POST /api/maintenance/invoices/generate
 */
export function generateMaintenanceInvoices(payload) {
  return apiFetch("/api/maintenance/invoices/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * ADMIN: Get all invoices
 * GET /api/maintenance/invoices
 */
export function fetchAllMaintenanceInvoices() {
  return apiFetch("/api/maintenance/invoices");
}

/**
 * RESIDENT: Get own invoices
 * GET /api/maintenance/invoices/my
 */
export function fetchMyMaintenanceInvoices() {
  return apiFetch("/api/maintenance/invoices/my");
}

/**
 * ADMIN: Mark invoice as PAID
 * PATCH /api/maintenance/invoices/:id/mark-paid
 */
export function markInvoicePaid(invoiceId) {
  return apiFetch(`/api/maintenance/invoices/${invoiceId}/mark-paid`, {
    method: "PATCH",
  });
}

/**
 * ADMIN: Delete invoice
 * DELETE /api/maintenance/invoices/:id
 */
export function deleteInvoice(invoiceId) {
  return apiFetch(`/api/maintenance/invoices/${invoiceId}`, {
    method: "DELETE",
  });
}
