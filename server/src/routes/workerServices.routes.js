import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/worker-services
 * Resident creates a service request
 */
router.post('/', requireAuth, async (req, res) => {
  const { service_category, description } = req.body;

  if (!service_category || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await req.supabase
    .from('worker_bookings')
    .insert({
      resident_id: req.userId,
      service_category,
      description,
      status: 'REQUESTED',
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

/**
 * GET /api/worker-services
 * Fetch service requests (RLS enforced - users see only their own data)
 */
router.get('/', requireAuth, async (req, res) => {
  const { status } = req.query;

  let query = req.supabase.from('worker_bookings').select('*');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * GET /api/worker-services/admin/all
 * Admin fetches ALL worker bookings (bypass RLS)
 */
router.get('/admin/all', requireAuth, async (req, res) => {
  const { status } = req.query;

  // 1) Verify ADMIN using RLS-safe check (checking the requester's own role)
  const { data: roleRow, error: roleError } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleError) {
    return res.status(400).json({ error: roleError.message });
  }

  if (roleRow?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // 2) Fetch ALL bookings using supabaseAdmin (Service Role bypasses RLS)
  let query = supabaseAdmin.from('worker_bookings').select('*');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * PATCH /api/worker-services/:id/assign
 * Admin assigns a WORKER
 */
router.patch('/:id/assign', requireAuth, async (req, res) => {
  const bookingId = req.params.id;
  const { worker_id } = req.body;

  if (!worker_id) {
    return res.status(400).json({ error: 'worker_id is required' });
  }

  // 1️⃣ Verify admin
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleRow?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // 2️⃣ Validate worker (admin client)
  const { data: workerProfile, error: workerError } =
    await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        status,
        roles ( name )
      `)
      .eq('id', worker_id)
      .single();

  if (workerError || !workerProfile) {
    return res.status(400).json({ error: 'Worker not found' });
  }

  if (workerProfile.roles?.name !== 'WORKER') {
    return res.status(400).json({ error: 'User is not a worker' });
  }

  if (workerProfile.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Worker is inactive' });
  }

  // 3️⃣ Assign worker
  const { data, error } = await req.supabase
    .from('worker_bookings')
    .update({
      worker_id: worker_id,
      status: 'ASSIGNED',
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  await supabaseAdmin.from('audit_logs').insert({
    user_id: req.userId,
    action: 'ASSIGN_WORKER_SERVICE',
    table_name: 'worker_bookings',
    record_id: bookingId,
  });

  res.json(data);
});

/**
 * PATCH /api/worker-services/:id/status
 * Worker updates status
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  const allowedStatuses = ['IN_PROGRESS', 'COMPLETED'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status transition' });
  }

  const { data: booking } = await req.supabase
    .from('worker_bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.worker_id !== req.userId) {
    return res.status(403).json({ error: 'Not assigned to this service' });
  }

  if (
    (booking.status === 'ASSIGNED' && status !== 'IN_PROGRESS') ||
    (booking.status === 'IN_PROGRESS' && status !== 'COMPLETED')
  ) {
    return res.status(400).json({ error: 'Invalid status transition' });
  }

  const { data, error } = await req.supabase
    .from('worker_bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * PATCH /api/worker-services/:id/cancel
 * Resident cancels service
 */
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const bookingId = req.params.id;

  const { data: booking } = await req.supabase
    .from('worker_bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.resident_id !== req.userId) {
    return res.status(403).json({ error: 'Not allowed to cancel this request' });
  }

  if (booking.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Completed service cannot be cancelled' });
  }

  const { data, error } = await req.supabase
    .from('worker_bookings')
    .update({ status: 'CANCELLED' })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

export default router;