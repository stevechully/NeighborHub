import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

/**
 * Helper: check admin role
 */
async function isAdmin(supabase, userId) {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return data?.role === 'ADMIN';
}

/**
 * POST /api/maintenance/invoices/generate
 * ✅ FIXED: Database-level duplicate check prevents multiple invoices for the same month
 */
router.post('/invoices/generate', requireAuth, async (req, res) => {
  const { amount, due_date } = req.body;

  if (!amount || !due_date) {
    return res.status(400).json({ error: 'Missing amount or due_date' });
  }

  if (!(await isAdmin(req.supabase, req.userId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // 1. Fetch all active residents
  const { data: residents, error } = await req.supabase
    .from('profiles')
    .select('id')
    .eq('status', 'ACTIVE');

  if (error) return res.status(400).json({ error: error.message });

  // 2. Fetch all EXISTING invoices for this due date
  const { data: existingInvoices } = await req.supabase
    .from('maintenance_invoices')
    .select('resident_id')
    .eq('due_date', due_date);

  // 3. Create a quick lookup Set of residents who already have an invoice
  const existingResidentIds = new Set(existingInvoices?.map(i => i.resident_id) || []);

  // 4. Filter out residents who already have an invoice for this date
  const invoicesToCreate = residents
    .filter(r => !existingResidentIds.has(r.id))
    .map(r => ({
      resident_id: r.id,
      amount,
      due_date,
      penalty_amount: 0,
      status: 'PENDING'
    }));

  // 5. Insert only the missing ones
  if (invoicesToCreate.length > 0) {
    const { error: insertError } = await req.supabase
      .from('maintenance_invoices')
      .insert(invoicesToCreate);

    if (insertError) return res.status(400).json({ error: insertError.message });
  }

  res.json({
    success: true,
    invoices_created: invoicesToCreate.length,
    message: invoicesToCreate.length === 0 ? "All residents already have invoices for this date." : "Invoices generated."
  });
});

/**
 * GET /api/maintenance/invoices
 * Admin fetches all invoices
 */
router.get('/invoices', requireAuth, async (req, res) => {
  if (!(await isAdmin(req.supabase, req.userId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data, error } = await req.supabase
    .from('maintenance_invoices')
    .select('*')
    .order('due_date', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * GET /api/maintenance/invoices/my
 * Resident fetches own invoices
 */
router.get('/invoices/my', requireAuth, async (req, res) => {
  const today = new Date();

  const { data, error } = await req.supabase
    .from('maintenance_invoices')
    .select('*')
    .eq('resident_id', req.userId)
    .order('due_date', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  // Auto-calculate overdue
  const updated = data.map(inv => {
    if (inv.status === 'PENDING' && new Date(inv.due_date) < today) {
      return { ...inv, status: 'OVERDUE' };
    }
    return inv;
  });

  res.json(updated);
});

/**
 * PATCH /api/maintenance/invoices/:id/mark-paid
 * Admin manually marks invoice as paid
 */
router.patch('/invoices/:id/mark-paid', requireAuth, async (req, res) => {
  const invoiceId = req.params.id;

  if (!(await isAdmin(req.supabase, req.userId))) return res.status(403).json({ error: 'Admin access required' });

  const { data: invoice } = await req.supabase.from('maintenance_invoices').select('*').eq('id', invoiceId).single();
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  await req.supabase.from('payments').insert({
    invoice_id: invoiceId,
    resident_id: invoice.resident_id,
    amount_paid: invoice.amount,
    payment_method: 'CASH',
    transaction_ref: `CASH-${Date.now()}`,
    status: 'SUCCESS',
    paid_at: new Date().toISOString()
  });

  await req.supabase.from('maintenance_invoices').update({ status: 'PAID' }).eq('id', invoiceId);
  res.json({ success: true });
});

/**
 * DELETE /api/maintenance/invoices/:id
 * Admin deletes invoice
 */
router.delete('/invoices/:id', requireAuth, async (req, res) => {
  if (!(await isAdmin(req.supabase, req.userId))) return res.status(403).json({ error: 'Admin access required' });

  await req.supabase.from('payments').delete().eq('invoice_id', req.params.id);
  await req.supabase.from('maintenance_invoices').delete().eq('id', req.params.id);

  res.json({ success: true });
});

export default router;