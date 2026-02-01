import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/complaints
 * Resident creates a complaint
 */
router.post('/', requireAuth, async (req, res) => {
  const { category, description, priority } = req.body;

  if (!category || !description || !priority) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority value' });
  }

  const { data, error } = await req.supabase
    .from('complaints')
    .insert({
      resident_id: req.userId,
      category,
      description,
      priority,
      status: 'NEW',
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

/**
 * GET /api/complaints
 * Fetch complaints (RLS decides visibility)
 */
router.get('/', requireAuth, async (req, res) => {
  const { status, priority } = req.query;

  let query = req.supabase.from('complaints').select('*');

  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * PATCH /api/complaints/:id/assign
 * Admin assigns a WORKER to a complaint
 */
router.patch('/:id/assign', requireAuth, async (req, res) => {
  const complaintId = req.params.id;
  const { worker_id } = req.body;

  if (!worker_id) {
    return res.status(400).json({ error: 'worker_id is required' });
  }

  // 1️⃣ Verify requester is ADMIN (RLS-safe: checking self)
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleRow?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // 2️⃣ 🔥 CRITICAL FIX: Verify WORKER role using admin client (bypass RLS)
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

  // 3️⃣ Assign worker and update status (RLS enforced)
  const { data, error } = await req.supabase
    .from('complaints')
    .update({
      assigned_worker_id: worker_id,
      status: 'ASSIGNED',
    })
    .eq('id', complaintId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // 4️⃣ Audit log (admin-level write)
  await supabaseAdmin.from('audit_logs').insert({
    user_id: req.userId,
    action: 'ASSIGN_WORKER',
    table_name: 'complaints',
    record_id: complaintId,
  });

  res.json(data);
});

/**
 * PATCH /api/complaints/:id/status
 * Worker updates complaint status
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  const complaintId = req.params.id;
  const { status } = req.body;

  const allowedStatuses = ['IN_PROGRESS', 'RESOLVED'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status transition' });
  }

  const { data: complaint } = await req.supabase
    .from('complaints')
    .select('*')
    .eq('id', complaintId)
    .single();

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  if (complaint.assigned_worker_id !== req.userId) {
    return res.status(403).json({ error: 'Not assigned to this complaint' });
  }

  // Enforce state machine
  if (
    (complaint.status === 'ASSIGNED' && status !== 'IN_PROGRESS') ||
    (complaint.status === 'IN_PROGRESS' && status !== 'RESOLVED')
  ) {
    return res.status(400).json({ error: 'Invalid status transition' });
  }

  const { data, error } = await req.supabase
    .from('complaints')
    .update({ status })
    .eq('id', complaintId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * PATCH /api/complaints/:id/close
 * Admin closes a complaint
 */
router.patch('/:id/close', requireAuth, async (req, res) => {
  const complaintId = req.params.id;

  // Verify admin role
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleRow?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data: complaint } = await req.supabase
    .from('complaints')
    .select('status')
    .eq('id', complaintId)
    .single();

  if (!complaint || complaint.status !== 'RESOLVED') {
    return res.status(400).json({ error: 'Complaint must be RESOLVED first' });
  }

  const { data, error } = await req.supabase
    .from('complaints')
    .update({ status: 'CLOSED' })
    .eq('id', complaintId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  await supabaseAdmin.from('audit_logs').insert({
    user_id: req.userId,
    action: 'CLOSE_COMPLAINT',
    table_name: 'complaints',
    record_id: complaintId,
  });

  res.json(data);
});

export default router;

