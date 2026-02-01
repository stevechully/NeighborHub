import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * Helper: verify admin role
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
 * POST /api/notices
 * Admin creates a notice
 */
router.post('/', requireAuth, async (req, res) => {
  const { title, content, priority, target, expires_at } = req.body;

  if (!title || !content || !priority || !target) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Admin check
  if (!(await isAdmin(req.supabase, req.userId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data, error } = await req.supabase
    .from('notices')
    .insert({
      title,
      content,
      priority,
      target,
      expires_at: expires_at ?? null,
      created_by: req.userId,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert({
    user_id: req.userId,
    action: 'CREATE_NOTICE',
    table_name: 'notices',
    record_id: data.id,
  });

  res.status(201).json(data);
});

/**
 * GET /api/notices
 * Fetch active (non-expired) notices
 */
router.get('/', requireAuth, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('notices')
    .select('*')
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * DELETE /api/notices/:id
 * Admin deletes a notice (hard delete)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const noticeId = req.params.id;

  // Admin check
  if (!(await isAdmin(req.supabase, req.userId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { error } = await req.supabase
    .from('notices')
    .delete()
    .eq('id', noticeId);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert({
    user_id: req.userId,
    action: 'DELETE_NOTICE',
    table_name: 'notices',
    record_id: noticeId,
  });

  res.json({ success: true });
});

export default router;
