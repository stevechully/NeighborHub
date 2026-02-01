import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

/**
 * POST /api/visitors
 * Security logs visitor entry
 */
router.post('/visitors', requireAuth, async (req, res) => {
  const { visitor_name, visitor_phone, purpose, resident_id } = req.body;

  // Validation
  if (!visitor_name || !resident_id || !purpose) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Role check: SECURITY or ADMIN
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (!['SECURITY', 'ADMIN'].includes(roleRow?.role)) {
    return res.status(403).json({ error: 'Security access required' });
  }

  const { data, error } = await req.supabase
    .from('visitors')
    .insert({
      visitor_name,
      visitor_phone,
      purpose,
      resident_id,
      entry_time: new Date().toISOString(),
      approved: false,
      created_by: req.userId,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

/**
 * PATCH /api/visitors/:id/exit
 * Security logs visitor exit
 */
router.patch('/visitors/:id/exit', requireAuth, async (req, res) => {
  const visitorId = req.params.id;

  // Role check
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (!['SECURITY', 'ADMIN'].includes(roleRow?.role)) {
    return res.status(403).json({ error: 'Security access required' });
  }

  const { data, error } = await req.supabase
    .from('visitors')
    .update({
      exit_time: new Date().toISOString(),
    })
    .eq('id', visitorId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * GET /api/visitors
 * Fetch visitors (RLS enforces visibility)
 * Resident → own records
 * Security/Admin → all records
 */
router.get('/visitors', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('visitors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * POST /api/parcels
 * Security logs parcel arrival
 */
router.post('/parcels', requireAuth, async (req, res) => {
  const { courier_name, tracking_number, resident_id } = req.body;

  // Validation
  if (!courier_name || !resident_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Role check: SECURITY or ADMIN
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (!['SECURITY', 'ADMIN'].includes(roleRow?.role)) {
    return res.status(403).json({ error: 'Security access required' });
  }

  const { data, error } = await req.supabase
    .from('parcels')
    .insert({
      courier_name,
      tracking_number,
      resident_id,
      status: 'RECEIVED',
      received_at: new Date().toISOString(),
      logged_by: req.userId,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

/**
 * PATCH /api/parcels/:id/pickup
 * Security marks parcel as picked up
 */
router.patch('/parcels/:id/pickup', requireAuth, async (req, res) => {
  const parcelId = req.params.id;

  // Role check
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (!['SECURITY', 'ADMIN'].includes(roleRow?.role)) {
    return res.status(403).json({ error: 'Security access required' });
  }

  const { data, error } = await req.supabase
    .from('parcels')
    .update({
      status: 'PICKED_UP',
      picked_up_at: new Date().toISOString(),
    })
    .eq('id', parcelId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * GET /api/parcels
 * Fetch parcels (RLS enforces visibility)
 * Resident → own records
 * Security/Admin → all records
 */
router.get('/parcels', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('parcels')
    .select('*')
    .order('received_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

export default router;

