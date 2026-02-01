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
  } = req.body;

  if (!name || !open_time || !close_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Verify admin
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
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

/**
 * GET /api/facilities
 * Fetch facilities (all users)
 */
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('facilities')
    .select('*')
    .order('name');

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * POST /api/facilities/:id/book
 * Resident books a facility
 */
router.post('/:id/book', requireAuth, async (req, res) => {
  console.log('BODY:', req.body);

  const facilityId = req.params.id;
  const { start_time, end_time } = req.body;

  // ✅ FIXED VALIDATION
  if (!start_time || !end_time) {
    return res.status(400).json({ error: 'Missing booking details' });
  }

  // ✅ FIXED OVERLAP CHECK (timestamp-based)
  const { data: conflicts, error: conflictError } = await req.supabase
    .from('facility_bookings')
    .select('id')
    .eq('facility_id', facilityId)
    .neq('status', 'CANCELLED')
    .or(`start_time.lt.${end_time},end_time.gt.${start_time}`);

  if (conflictError) {
    return res.status(400).json({ error: conflictError.message });
  }

  if (conflicts && conflicts.length > 0) {
    return res.status(400).json({ error: 'Time slot already booked' });
  }

  // ✅ FIXED INSERT (NO date column)
  const { data, error } = await req.supabase
    .from('facility_bookings')
    .insert({
      facility_id: facilityId,
      resident_id: req.userId,
      start_time,
      end_time,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

/**
 * GET /api/facilities/bookings
 * Fetch facility bookings (RLS handles visibility)
 */
router.get('/bookings', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('facility_bookings')
    .select(`
      *,
      facilities ( name )
    `)
    .order('start_time', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * PATCH /api/facilities/bookings/:id
 * Admin approves or cancels booking
 */
router.patch('/bookings/:id', requireAuth, async (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  if (!['APPROVED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Verify admin
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleRow?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data, error } = await req.supabase
    .from('facility_bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  await supabaseAdmin.from('audit_logs').insert({
    user_id: req.userId,
    action: 'UPDATE_FACILITY_BOOKING',
    table_name: 'facility_bookings',
    record_id: bookingId,
  });

  res.json(data);
});

export default router;

