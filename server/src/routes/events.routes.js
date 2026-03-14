import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

async function isAdmin(supabase, userId) {
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
  return data?.role === 'ADMIN';
}

router.post('/', requireAuth, async (req, res) => {
  const { title, description, event_date, location, capacity, is_paid, fee } = req.body;
  if (!title || !event_date || !location || !capacity) return res.status(400).json({ error: 'Missing required fields' });
  if (!(await isAdmin(req.supabase, req.userId))) return res.status(403).json({ error: 'Admin access required' });

  const { data, error } = await req.supabase.from('events').insert({
      title, description, event_date, location, capacity, is_paid: is_paid || false, fee: fee || 0, created_by: req.userId,
    }).select().single();

  if (error) return res.status(400).json({ error: error.message });
  await supabaseAdmin.from('audit_logs').insert({ user_id: req.userId, action: 'CREATE_EVENT', table_name: 'events', record_id: data.id });
  res.status(201).json(data);
});

router.get('/', requireAuth, async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('events').select('*').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * GET /api/events/my
 * ✅ FIXED: Removed `.neq('status', 'CANCELLED')` so users can see cancelled tickets to request refunds
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { data: registrations, error: regError } = await req.supabase
      .from('event_registrations')
      .select(`id, status, payment_status, event_id, events ( id, title, event_date, location, is_paid, fee )`)
      .eq('user_id', userId); 

    if (regError) throw regError;
    if (!registrations || registrations.length === 0) return res.json([]);

    const { data: payments } = await req.supabase.from('event_payments').select('id, event_id, refund_status').eq('user_id', userId);

    const formatted = registrations.map((reg) => {
      const payment = payments?.find((p) => p.event_id === reg.event_id);
      return {
        registration_id: reg.id, status: reg.status, payment_status: reg.payment_status,
        ...reg.events, event_payments: payment || null
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/my/:registrationId/cancel", requireAuth, async (req, res) => {
  try {
    const { data: registration, error: fetchError } = await req.supabase.from("event_registrations").select("*").eq("id", req.params.registrationId).single();
    if (fetchError || !registration) return res.status(404).json({ error: "Registration not found" });
    if (registration.user_id !== req.userId) return res.status(403).json({ error: "Not allowed" });

    const { error: updateError } = await req.supabase
      .from("event_registrations").update({ status: "CANCELLED" }).eq("id", req.params.registrationId).eq("user_id", req.userId);
    if (updateError) throw updateError;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/register', requireAuth, async (req, res) => {
  const eventId = req.params.id;
  const { data: event } = await req.supabase.from('events').select('*').eq('id', eventId).single();
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { data: existing } = await req.supabase.from('event_registrations').select('id').eq('event_id', eventId).eq('user_id', req.userId).neq('status', 'CANCELLED').single();
  if (existing) return res.status(400).json({ error: 'Already registered' });

  const paymentStatus = event.is_paid ? 'PENDING' : 'PAID';
  const { data, error } = await req.supabase.from('event_registrations').insert({
      event_id: eventId, user_id: req.userId, payment_status: paymentStatus, status: 'REGISTERED'
    }).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * ✅ NEW: POST /api/events/payments/:id/refund
 * Resident requests a refund for an event
 */
router.post("/payments/:id/refund", requireAuth, async (req, res) => {
  const paymentId = req.params.id;
  const { reason } = req.body;

  const { data: payment } = await req.supabase.from("event_payments").select("*").eq("id", paymentId).single();
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  if (payment.user_id !== req.userId) return res.status(403).json({ error: "Not your payment" });
  if (payment.refund_status !== "NONE") return res.status(400).json({ error: "Refund already requested" });

  const { error } = await req.supabase.from("event_payments").update({ refund_status: "REQUESTED" }).eq("id", paymentId);
  if (error) return res.status(400).json({ error: error.message });

  res.json({ success: true, message: "Refund requested" });
});

/**
 * ✅ NEW: POST /api/events/payments/:id/refund/approve
 * Admin approves a refund
 */
router.post("/payments/:id/refund/approve", requireAuth, async (req, res) => {
  if (!(await isAdmin(req.supabase, req.userId))) return res.status(403).json({ error: 'Admin access required' });

  const paymentId = req.params.id;
  const { error } = await req.supabase.from("event_payments").update({ refund_status: "REFUNDED" }).eq("id", paymentId);
  
  // Optionally update registration payment status
  const { data: payRecord } = await req.supabase.from("event_payments").select("registration_id").eq("id", paymentId).single();
  if (payRecord?.registration_id) {
    await req.supabase.from("event_registrations").update({ payment_status: "REFUNDED" }).eq("id", payRecord.registration_id);
  }

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;