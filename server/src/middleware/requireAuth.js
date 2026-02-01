import { supabaseAdmin, createUserSupabaseClient } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing auth token' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = data.user;
    req.userId = data.user.id;

    // Create RLS-safe client
    req.supabase = createUserSupabaseClient(token);

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Auth middleware failed' });
  }
};

