import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

const ALLOWED_METHODS = [
  'MOCK_CARD',
  'MOCK_UPI',
  'CASH',
  'BANK_TRANSFER'
];

/**
 * POST /api/payments/mock
 * Resident makes mock payment
 */
router.post('/mock', requireAuth, async (req, res) => {
  const { invoice_id, payment_method } = req.body;

  if (!invoice_id || !payment_method) {
    return res.status(400).json({ error: 'Missing invoice_id or payment_method' });
  }

  if (!ALLOWED_METHODS.includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  const { data: invoice } = await req.supabase
    .from('maintenance_invoices')
    .select('*')
    .eq('id', invoice_id)
    .single();

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  if (invoice.resident_id !== req.userId) {
    return res.status(403).json({ error: 'Not your invoice' });
  }

  if (invoice.status === 'PAID') {
    return res.status(400).json({ error: 'Invoice already paid' });
  }

  const transactionRef = `MOCK-${Date.now()}`;

  await req.supabase.from('payments').insert({
    invoice_id,
    resident_id: req.userId,
    amount_paid: invoice.amount,
    payment_method,
    transaction_ref: transactionRef,
    status: 'SUCCESS',
    paid_at: new Date().toISOString()
  });

  await req.supabase
    .from('maintenance_invoices')
    .update({ status: 'PAID' })
    .eq('id', invoice_id);

  res.json({
    success: true,
    transaction_ref: transactionRef
  });
});

/**
 * GET /api/payments/my
 * Resident fetches own payments
 */
router.get('/my', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('payments')
    .select('*')
    .eq('resident_id', req.userId)
    .order('paid_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * GET /api/payments
 * Admin fetches all payments
 */
router.get('/', requireAuth, async (req, res) => {
  const { data: role } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (role?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data, error } = await req.supabase
    .from('payments')
    .select('*')
    .order('paid_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * GET /api/payments/:id/receipt
 * Printable receipt data
 */
router.get('/:id/receipt', requireAuth, async (req, res) => {
  const paymentId = req.params.id;

  const { data: payment } = await req.supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  if (payment.resident_id !== req.userId) {
    const { data: role } = await req.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', req.userId)
      .single();

    if (role?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  res.json({
    receipt_no: payment.transaction_ref,
    amount_paid: payment.amount_paid,
    payment_method: payment.payment_method,
    paid_at: payment.paid_at
  });
});

export default router;
