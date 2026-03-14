import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

const ALLOWED_METHODS = [
  'MOCK_CARD',
  'MOCK_UPI',
  'BANK_TRANSFER',
  'UPI',   // ✅ Modal methods
  'CASH'   // ✅ Modal methods
];

/**
 * POST /api/payments/confirm
 * ✅ UNIVERSAL ROUTER: Events, Maintenance, Facilities, and Marketplace Cart
 */
router.post('/confirm', requireAuth, async (req, res) => {
  const { module, reference_id, amount, payment_method } = req.body;

  if (!module || !reference_id || amount === undefined || !payment_method) {
    return res.status(400).json({ error: 'Missing required payment details' });
  }

  if (!ALLOWED_METHODS.includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  const transactionRef = `TXN-${Date.now()}`;
  let paymentRecord = null;

  try {
    if (module === 'EVENT') {
      // 1. Fetch the registration ID
      const { data: registration } = await req.supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', reference_id)
        .eq('user_id', req.userId)
        .single();

      // 2. Insert into event_payments
      const { data, error } = await req.supabase
        .from('event_payments')
        .insert({
          event_id: reference_id,
          user_id: req.userId,
          registration_id: registration?.id,
          amount_paid: amount,
          payment_method,
          transaction_ref: transactionRef,
          refund_status: 'NONE'
        })
        .select().single();

      if (error) throw error;
      paymentRecord = data;

      // 3. Update Status
      await req.supabase
        .from('event_registrations')
        .update({ payment_status: 'PAID' })
        .eq('event_id', reference_id)
        .eq('user_id', req.userId);

    } else if (module === 'MAINTENANCE') {
      // 1. Insert into maintenance payments
      const { data, error } = await req.supabase
        .from('payments')
        .insert({
          invoice_id: reference_id,
          resident_id: req.userId,
          amount_paid: amount,
          payment_method,
          transaction_ref: transactionRef,
          status: 'SUCCESS',
          paid_at: new Date().toISOString()
        })
        .select().single();

      if (error) throw error;
      paymentRecord = data;

      // 2. Update Invoice
      await req.supabase
        .from('maintenance_invoices')
        .update({ status: 'PAID' })
        .eq('id', reference_id);

    } else if (module === 'FACILITY') {
      // ✅ FIX: 1. Insert the official receipt into facility_payments
      const { data, error } = await req.supabase
        .from('facility_payments')
        .insert({
          booking_id: reference_id,
          resident_id: req.userId,
          amount_paid: amount,
          payment_method,
          transaction_ref: transactionRef,
          refund_status: 'NONE'
        })
        .select().single();

      if (error) throw error;
      paymentRecord = data;

      // 2. Update Booking Status
      await req.supabase
        .from('facility_bookings')
        .update({ payment_status: 'PAID', status: 'CONFIRMED' }) 
        .eq('id', reference_id);

    } else if (module === 'MARKETPLACE_CART') {
      // Handle Marketplace Cart (reference_id is the cart array)
      const cart = reference_id; 
      
      for (const item of cart) {
        const { product_id, quantity } = item;

        // Verify stock and price
        const { data: product } = await req.supabase
          .from("marketplace_products")
          .select("price, seller_id, quantity")
          .eq("id", product_id)
          .single();

        if (!product) throw new Error(`Product ${item.name} not found`);
        if (product.quantity < quantity) throw new Error(`Insufficient stock for ${item.name}`);

        const orderAmount = product.price * quantity;

        // Create the Order
        const { data: order, error: orderErr } = await req.supabase
          .from("marketplace_orders")
          .insert({
            product_id,
            buyer_id: req.userId,
            seller_id: product.seller_id,
            quantity,
            status: "PAID",
            payment_status: "PAID"
          })
          .select().single();
        
        if (orderErr) throw orderErr;

        // Create the individual Marketplace Payment record
        await req.supabase
          .from("marketplace_payments")
          .insert({
            order_id: order.id,
            buyer_id: req.userId,
            amount_paid: orderAmount,
            payment_method,
            transaction_ref: transactionRef,
            status: "SUCCESS",
            paid_at: new Date().toISOString(),
            refund_status: "NONE"
          });

        // Deduct Stock
        await req.supabase
          .from("marketplace_products")
          .update({ quantity: product.quantity - quantity })
          .eq("id", product_id);
      }
    } else {
      throw new Error("Invalid payment module specified.");
    }

    // Success Response
    res.status(201).json({
      success: true,
      transaction_ref: transactionRef,
      payment: paymentRecord
    });

  } catch (err) {
    console.error(`[Payment Error - ${module}]:`, err.message);
    return res.status(400).json({ error: err.message });
  }
});

/**
 * Legacy Support & History Routes
 */

router.post('/mock', requireAuth, async (req, res) => {
  const { invoice_id, payment_method } = req.body;
  if (!invoice_id || !payment_method) return res.status(400).json({ error: 'Missing details' });

  const { data: invoice } = await req.supabase.from('maintenance_invoices').select('*').eq('id', invoice_id).single();
  if (!invoice || invoice.resident_id !== req.userId) return res.status(403).json({ error: 'Invalid invoice' });

  const transactionRef = `MOCK-${Date.now()}`;
  await req.supabase.from('payments').insert({
    invoice_id, resident_id: req.userId, amount_paid: invoice.amount,
    payment_method, transaction_ref: transactionRef, status: 'SUCCESS', paid_at: new Date().toISOString()
  });

  await req.supabase.from('maintenance_invoices').update({ status: 'PAID' }).eq('id', invoice_id);
  res.json({ success: true, transaction_ref: transactionRef });
});

router.get('/my', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase.from('payments').select('*').eq('resident_id', req.userId).order('paid_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/', requireAuth, async (req, res) => {
  const { data: role } = await req.supabase.from('user_roles').select('role').eq('user_id', req.userId).single();
  if (role?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { data, error } = await req.supabase.from('payments').select('*').order('paid_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id/receipt', requireAuth, async (req, res) => {
  const { data: payment } = await req.supabase.from('payments').select('*').eq('id', req.params.id).single();
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  if (payment.resident_id !== req.userId) {
    const { data: role } = await req.supabase.from('user_roles').select('role').eq('user_id', req.userId).single();
    if (role?.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });
  }

  res.json({
    receipt_no: payment.transaction_ref,
    amount_paid: payment.amount_paid,
    payment_method: payment.payment_method,
    paid_at: payment.paid_at
  });
});

export default router;