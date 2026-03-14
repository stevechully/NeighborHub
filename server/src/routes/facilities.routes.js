import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/facilities
 */
router.post('/', requireAuth, async (req, res) => {
  const { name, description, capacity, is_paid, fee, open_time, close_time, approval_required, slot_duration_minutes } = req.body;

  if (!name || !open_time || !close_time) return res.status(400).json({ error: 'Missing required fields' });

  const { data: roleRow } = await req.supabase.from('user_roles').select('role').eq('user_id', req.userId).single();
  if (roleRow?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { data, error } = await req.supabase
    .from('facilities')
    .insert({
      name, description, capacity,
      is_paid: is_paid ?? false,
      fee: is_paid ? fee : null,
      open_time, close_time,
      approval_required: approval_required ?? true,
      slot_duration_minutes: slot_duration_minutes || 60,
      is_active: true
    })
    .select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * PUT /api/facilities/:id
 */
router.put('/:id', requireAuth, async (req, res) => {
  const { data: roleRow } = await req.supabase.from('user_roles').select('role').eq('user_id', req.userId).single();
  if (roleRow?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { data, error } = await req.supabase.from('facilities').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * PATCH /api/facilities/:id/deactivate
 */
router.patch('/:id/deactivate', requireAuth, async (req, res) => {
  const { data: roleRow } = await req.supabase.from('user_roles').select('role').eq('user_id', req.userId).single();
  if (roleRow?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { error } = await req.supabase.from('facilities').update({ is_active: false }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

/**
 * GET /api/facilities
 */
router.get('/', requireAuth, async (req, res) => {
  const { data: roleRow } = await req.supabase.from('user_roles').select('role').eq('user_id', req.userId).single();
  let query = req.supabase.from('facilities').select('*');
  if (roleRow?.role !== 'ADMIN') query = query.eq('is_active', true);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * GET /api/facilities/my-bookings
 * ✅ FIXED: Now strictly orders by created_at DESC (Newest first)
 */
router.get("/my-bookings", requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("facility_bookings")
      .select(`
        *,
        facilities(name, fee, is_paid), 
        facility_payments(id, refund_status)
      `)
      .eq("resident_id", req.userId)
      .order("created_at", { ascending: false }); // <-- THIS IS THE FIX

    if (error) return res.status(400).json({ error: error.message });

    const flattened = data.map(b => ({
      ...b,
      facility_payments: Array.isArray(b.facility_payments) ? b.facility_payments[0] : b.facility_payments
    }));

    res.json(flattened);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch your bookings" });
  }
});

/**
 * GET /api/facilities/:id/bookings?date=YYYY-MM-DD
 */
router.get("/:id/bookings", requireAuth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date required" });

    const startOfDay = new Date(date + "T00:00:00");
    const endOfDay = new Date(date + "T23:59:59");

    const { data, error } = await req.supabase
      .from("facility_bookings")
      .select("start_time, end_time, status")
      .eq("facility_id", req.params.id)
      .in("status", ["CONFIRMED", "RESERVED", "APPROVED"])
      .gte("start_time", startOfDay.toISOString())
      .lte("end_time", endOfDay.toISOString());

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

/**
 * POST /api/facilities/:id/book
 */
router.post('/:id/book', requireAuth, async (req, res) => {
  try {
    const { start_time, end_time } = req.body;
    if (!start_time || !end_time) return res.status(400).json({ error: 'Missing booking details' });

    await req.supabase
      .from("facility_bookings")
      .update({ status: "EXPIRED", payment_status: "EXPIRED" })
      .eq("status", "RESERVED")
      .lt("expires_at", new Date().toISOString());

    const { data: facility, error: facilityError } = await req.supabase
        .from("facilities").select("*").eq("id", req.params.id).single();

    if (!facility || facilityError || !facility.is_active) {
      return res.status(404).json({ error: "Facility not found or inactive" });
    }

    const { data: overlapping } = await req.supabase
      .from("facility_bookings").select("id").eq("facility_id", req.params.id)
      .in("status", ["CONFIRMED", "RESERVED", "APPROVED"]) 
      .lt("start_time", end_time).gt("end_time", start_time);

    if (overlapping && overlapping.length > 0) return res.status(400).json({ error: "Slot already booked" });

    let status = "CONFIRMED";
    let payment_status = "NOT_REQUIRED";
    let expires_at = null;

    if (facility.is_paid) {
      status = "RESERVED";
      payment_status = "PENDING";
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15);
      expires_at = expiry.toISOString();
    }

    const { data, error } = await req.supabase
      .from("facility_bookings")
      .insert({
        facility_id: req.params.id, resident_id: req.userId, start_time, end_time, status, payment_status, expires_at
      }).select().single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Booking failed" });
  }
});

/**
 * GET /api/facilities/bookings
 * ✅ FIXED: Now strictly orders by created_at DESC
 */
router.get('/bookings', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('facility_bookings')
    .select(`*, facilities ( name, fee, is_paid ), facility_payments(id, refund_status)`)
    .order('created_at', { ascending: false }); // <-- THIS IS THE FIX

  if (error) return res.status(400).json({ error: error.message });

  const flattened = data.map(b => ({
    ...b,
    facility_payments: Array.isArray(b.facility_payments) ? b.facility_payments[0] : b.facility_payments
  }));
  res.json(flattened);
});

/**
 * PATCH /api/facilities/bookings/:id/cancel
 */
router.patch("/bookings/:id/cancel", requireAuth, async (req, res) => {
  try {
    const { data: roleRow } = await req.supabase.from('user_roles').select('role').eq('user_id', req.userId).single();
    const isAdmin = roleRow?.role === 'ADMIN';

    const { data: booking, error: fetchError } = await req.supabase.from("facility_bookings").select("*").eq("id", req.params.id).single();
    if (fetchError || !booking) return res.status(404).json({ error: "Booking not found" });

    if (!isAdmin && booking.resident_id !== req.userId) return res.status(403).json({ error: "Not authorized" });
    if (new Date(booking.start_time) < new Date()) return res.status(400).json({ error: "Cannot cancel a past booking" });

    const { data, error: updateError } = await req.supabase
      .from("facility_bookings").update({ status: "CANCELLED", payment_status: "CANCELLED" }).eq("id", req.params.id).select().single();

    if (updateError) return res.status(400).json({ error: updateError.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Cancellation failed" });
  }
});

/**
 * PATCH /api/facilities/bookings/:id
 */
router.patch('/bookings/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!['APPROVED', 'CANCELLED', 'CONFIRMED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { data: roleRow } = await req.supabase.from('user_roles').select('role').eq('user_id', req.userId).single();
  if (roleRow?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { data, error } = await req.supabase.from('facility_bookings').update({ status }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;