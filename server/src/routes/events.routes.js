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
  const { title, description, event_date, location, capacity } = req.body;

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
 * POST /api/events/:id/join
 * Resident joins an event (RSVP)
 */
router.post('/:id/join', requireAuth, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.userId;

  // 1️⃣ Fetch event
  const { data: event, error: eventError } = await req.supabase
    .from('events')
    .select('id, capacity, event_date')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (new Date(event.event_date) < new Date()) {
    return res.status(400).json({ error: 'Event already occurred' });
  }

  // 2️⃣ Check if already joined
  const { data: existing } = await req.supabase
    .from('event_participants')
    .select('event_id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Already joined this event' });
  }

  // 3️⃣ Capacity check
  const { count } = await req.supabase
    .from('event_participants')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (count >= event.capacity) {
    return res.status(400).json({ error: 'Event capacity reached' });
  }

  // 4️⃣ Join event
  const { error } = await req.supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: userId,
      joined_at: new Date().toISOString(),
    });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  await supabaseAdmin.from('audit_logs').insert({
    user_id: userId,
    action: 'JOIN_EVENT',
    table_name: 'event_participants',
    record_id: eventId,
  });

  res.status(201).json({ success: true });
});

/**
 * DELETE /api/events/:id
 * Admin deletes an event (hard delete)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const eventId = req.params.id;

  if (!(await isAdmin(req.supabase, req.userId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Remove participants first
  await req.supabase
    .from('event_participants')
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
