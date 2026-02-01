import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// GET /api/profile/me
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('profiles')
    .select('*')
    .eq('id', req.userId)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// PATCH /api/profile/me
router.patch('/me', requireAuth, async (req, res) => {
  const allowedFields = ['full_name', 'phone', 'flat_number', 'block'];
  const payload = {};

  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      payload[key] = req.body[key];
    }
  }

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { error } = await req.supabase
    .from('profiles')
    .update(payload)
    .eq('id', req.userId);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true });
});

export default router;

