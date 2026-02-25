import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/facilities
 * Admin creates a facility
 */
router.post('/', requireAuth, async (req, res) => {
  const {
    name,
    description,
    capacity,
    is_paid,
    fee,
    open_time,
    close_time,
    approval_required,
    slot_duration_minutes
  } = req.body;

  if (!name || !open_time || !close_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleRow?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data, error } = await req.supabase
    .from('facilities')
    .insert({
      name,
      description,
      capacity,
      is_paid: is_paid ?? false,
      fee: is_paid ? fee : null,
      open_time,
      close_time,
      approval_required: approval_required ?? true,
      slot_duration_minutes: slot_duration_minutes || 60,
      is_active: true
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * PUT /api/facilities/:id
 * Admin updates a facility
 */
router.put('/:id', requireAuth, async (req, res) => {
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleRow?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data, error } = await req.supabase
    .from('facilities')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * PATCH /api/facilities/:id/deactivate
 * Admin soft-disables a facility
 */
router.patch('/:id/deactivate', requireAuth, async (req, res) => {
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleRow?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { error } = await req.supabase
    .from('facilities')
    .update({ is_active: false })
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

/**
 * GET /api/facilities
 * Fetch facilities sorted by created_at DESC
 */
router.get('/', requireAuth, async (req, res) => {
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  let query = req.supabase.from('facilities').select('*');

  if (roleRow?.role !== 'ADMIN') {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * GET /api/facilities/:id/bookings?date=YYYY-MM-DD
 */
router.get("/:id/bookings", requireAuth, async (req, res) => {
  try {
    const facilityId = req.params.id;
    const { date } = req.query;

    if (!date) return res.status(400).json({ error: "Date required" });

    const startOfDay = new Date(date + "T00:00:00");
    const endOfDay = new Date(date + "T23:59:59");

    const { data, error } = await req.supabase
      .from("facility_bookings")
      .select("start_time, end_time, status")
      .eq("facility_id", facilityId)
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
    const facilityId = req.params.id;
    const userId = req.userId;
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'Missing booking details' });
    }

    await req.supabase
      .from("facility_bookings")
      .update({ status: "EXPIRED", payment_status: "EXPIRED" })
      .eq("status", "RESERVED")
      .lt("expires_at", new Date().toISOString());

    const { data: facility, error: facilityError } = await req.supabase
        .from("facilities")
        .select("*")
        .eq("id", facilityId)
        .single();

    if (!facility || facilityError || !facility.is_active) {
      return res.status(404).json({ error: "Facility not found or inactive" });
    }

    const { data: overlapping } = await req.supabase
      .from("facility_bookings")
      .select("id")
      .eq("facility_id", facilityId)
      .in("status", ["CONFIRMED", "RESERVED", "APPROVED"]) 
      .lt("start_time", end_time)
      .gt("end_time", start_time);

    if (overlapping && overlapping.length > 0) {
      return res.status(400).json({ error: "Slot already booked" });
    }

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
        facility_id: facilityId,
        resident_id: userId,
        start_time,
        end_time,
        status,
        payment_status,
        expires_at
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Booking failed" });
  }
});

/**
 * POST /api/facilities/bookings/:id/pay
 */
router.post("/bookings/:id/pay", requireAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.userId;
    const { payment_method } = req.body;

    const { data: booking, error: fetchError } = await req.supabase
      .from("facility_bookings")
      .select("*, facilities(fee, is_paid)")
      .eq("id", bookingId)
      .single();

    if (!booking || fetchError) return res.status(404).json({ error: "Booking not found" });
    if (booking.resident_id !== userId) return res.status(403).json({ error: "Not allowed" });
    if (booking.status !== "RESERVED") return res.status(400).json({ error: "Booking not payable" });
    if (booking.expires_at && new Date(booking.expires_at) < new Date()) return res.status(400).json({ error: "Booking expired" });

    const transaction_ref = `FAC-${Date.now()}`;
    const { error: payError } = await req.supabase.from("facility_payments").insert({
      booking_id: bookingId,
      resident_id: userId,
      amount_paid: booking.facilities.fee,
      payment_method,
      transaction_ref
    });

    if (payError) return res.status(400).json({ error: payError.message });

    await req.supabase
      .from("facility_bookings")
      .update({ status: "CONFIRMED", payment_status: "PAID", expires_at: null })
      .eq("id", bookingId);

    res.json({ success: true, transaction_ref });
  } catch (err) {
    res.status(500).json({ error: "Payment failed" });
  }
});

/**
 * GET /api/facilities/bookings
 */
router.get('/bookings', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('facility_bookings')
    .select(`*, facilities ( name )`)
    .order('start_time', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * PATCH /api/facilities/bookings/:id/cancel
 * Logic to allow Residents to cancel their own bookings & Admin to cancel any
 */
router.patch("/bookings/:id/cancel", requireAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.userId;

    const { data: roleRow } = await req.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const isAdmin = roleRow?.role === 'ADMIN';

    const { data: booking, error: fetchError } = await req.supabase
      .from("facility_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) return res.status(404).json({ error: "Booking not found" });

    // Authorization check
    if (!isAdmin && booking.resident_id !== userId) {
      return res.status(403).json({ error: "Not authorized to cancel this booking" });
    }

    // Prevent cancelling past bookings
    if (new Date(booking.start_time) < new Date()) {
      return res.status(400).json({ error: "Cannot cancel a past booking" });
    }

    const { data, error: updateError } = await req.supabase
      .from("facility_bookings")
      .update({ status: "CANCELLED", payment_status: "CANCELLED" })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) return res.status(400).json({ error: updateError.message });

    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'CANCEL_FACILITY_BOOKING',
      table_name: 'facility_bookings',
      record_id: bookingId,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Cancellation failed" });
  }
});

/**
 * PATCH /api/facilities/bookings/:id
 * Admin specific approval/cancellation override
 */
router.patch('/bookings/:id', requireAuth, async (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  if (!['APPROVED', 'CANCELLED', 'CONFIRMED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleRow?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { data, error } = await req.supabase
    .from('facility_bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from('audit_logs').insert({
    user_id: req.userId,
    action: 'UPDATE_FACILITY_BOOKING',
    table_name: 'facility_bookings',
    record_id: bookingId,
  });

  res.json(data);
});

export default router;