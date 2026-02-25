import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * Helper: check if user is ADMIN
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
 * POST /api/events
 * Admin creates an event
 */
router.post('/', requireAuth, async (req, res) => {
  const { title, description, event_date, location, capacity, is_paid, fee } = req.body;

  if (!title || !event_date || !location || !capacity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!(await isAdmin(req.supabase, req.userId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data, error } = await req.supabase
    .from('events')
    .insert({
      title,
      description,
      event_date,
      location,
      capacity,
      is_paid: is_paid || false,
      fee: fee || 0,
      created_by: req.userId,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  await supabaseAdmin.from('audit_logs').insert({
    user_id: req.userId,
    action: 'CREATE_EVENT',
    table_name: 'events',
    record_id: data.id,
  });

  res.status(201).json(data);
});

/**
 * GET /api/events
 * Fetch upcoming events (all users)
 */
router.get('/', requireAuth, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * GET /api/events/my
 * Fetch events current user registered for (SAFE VERSION)
 * ✅ Merges registrations and payments manually to prevent nesting issues
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // 1️⃣ Fetch registrations with event details
    const { data: registrations, error: regError } = await req.supabase
      .from('event_registrations')
      .select(`
        id,
        status,
        payment_status,
        event_id,
        events (
          id,
          title,
          event_date,
          location,
          is_paid,
          fee
        )
      `)
      .eq('user_id', userId);

    if (regError) throw regError;

    if (!registrations || registrations.length === 0) {
      return res.json([]);
    }

    // 2️⃣ Fetch all payments for this user to merge manually
    const { data: payments } = await req.supabase
      .from('event_payments')
      .select('id, event_id, refund_status')
      .eq('user_id', userId);

    // 3️⃣ Merge payments into registrations
    const formatted = registrations.map((reg) => {
      const payment = payments?.find(
        (p) => p.event_id === reg.event_id
      );

      return {
        registration_id: reg.id,
        status: reg.status,
        payment_status: reg.payment_status,
        ...reg.events,
        event_payments: payment || null
      };
    });

    res.json(formatted);

  } catch (err) {
    console.error("MY EVENTS ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/events/my/:registrationId/cancel
 * Resident cancels their own event registration
 */
router.patch("/my/:registrationId/cancel", requireAuth, async (req, res) => {
  try {
    const registrationId = req.params.registrationId;
    const userId = req.userId;

    const { data: registration, error: fetchError } = await req.supabase
      .from("event_registrations")
      .select("*")
      .eq("id", registrationId)
      .single();

    if (fetchError || !registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    if (registration.user_id !== userId) {
      return res.status(403).json({ error: "Not allowed to cancel this registration" });
    }

    const { error: updateError } = await req.supabase
      .from("event_registrations")
      .update({ status: "CANCELLED" })
      .eq("id", registrationId);

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/events/:id/register
 */
router.post('/:id/register', requireAuth, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.userId;

  const { data: event } = await req.supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { data: existing } = await req.supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Already registered' });
  }

  const paymentStatus = event.is_paid ? 'PENDING' : 'PAID';

  const { data, error } = await req.supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      user_id: userId,
      payment_status: paymentStatus,
      status: 'REGISTERED'
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json(data);
});

/**
 * POST /api/events/:id/pay
 */
router.post('/:id/pay', requireAuth, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.userId;
  const { payment_method } = req.body;

  const { data: event } = await req.supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!event || !event.is_paid) {
    return res.status(400).json({ error: 'Invalid event' });
  }

  const transactionRef = `EVT-${Date.now()}`;

  const { data: registration } = await req.supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  await req.supabase.from('event_payments').insert({
    event_id: eventId,
    user_id: userId,
    registration_id: registration?.id,
    amount_paid: event.fee,
    payment_method,
    transaction_ref: transactionRef,
    refund_status: 'NONE'
  });

  await req.supabase
    .from('event_registrations')
    .update({ payment_status: 'PAID' })
    .eq('event_id', eventId)
    .eq('user_id', userId);

  res.json({
    success: true,
    transaction_ref: transactionRef
  });
});

/**
 * DELETE /api/events/:id
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const eventId = req.params.id;

  if (!(await isAdmin(req.supabase, req.userId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  await req.supabase
    .from('event_registrations')
    .delete()
    .eq('event_id', eventId);

  const { error } = await req.supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  await supabaseAdmin.from('audit_logs').insert({
    user_id: req.userId,
    action: 'DELETE_EVENT',
    table_name: 'events',
    record_id: eventId,
  });

  res.json({ success: true });
});

export default router;