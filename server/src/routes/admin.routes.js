import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

/**
 * HELPER: Verify if user has one of the allowed roles
 */
async function checkRole(req, allowedRoles) {
  const { data: roleRow } = await req.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", req.userId)
    .single();

  return allowedRoles.includes(roleRow?.role);
}

// --- 1. GET /api/admin/workers ---
// Admin only: Fetch all active workers
router.get("/workers", requireAuth, async (req, res) => {
  try {
    if (!(await checkRole(req, ["ADMIN"]))) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { data, error } = await req.supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        status,
        roles!inner ( name )
      `)
      .eq("status", "ACTIVE")
      .eq("roles.name", "WORKER");

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- 2. GET /api/admin/residents ---
// Admin & Security: Fetch active residents for dropdowns/Gate Management
router.get("/residents", requireAuth, async (req, res) => {
  try {
    // Both Admin and Security need this list to log visitors/parcels
    if (!(await checkRole(req, ["ADMIN", "SECURITY"]))) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { data, error } = await req.supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        status,
        roles!inner ( name )
      `)
      .eq("status", "ACTIVE")
      .eq("roles.name", "RESIDENT")
      .order("full_name", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- 3. PATCH /api/admin/users/:id ---
// Admin only: Update user role/status and log audit
router.patch('/users/:id', requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.userId) {
      return res.status(400).json({ error: 'Cannot modify own account' });
    }

    if (!(await checkRole(req, ["ADMIN"]))) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const payload = {};
    if (req.body.role_id) payload.role_id = req.body.role_id;
    if (req.body.status) payload.status = req.body.status;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const { error } = await req.supabase
      .from('profiles')
      .update(payload)
      .eq('id', targetUserId);

    if (error) return res.status(400).json({ error: error.message });

    // Audit log (Fixed: Using req.userId as the actor)
    await req.supabase.from('audit_logs').insert({
      user_id: req.userId,
      action: 'ADMIN_UPDATE_USER',
      table_name: 'profiles',
      record_id: targetUserId,
      details: JSON.stringify(payload)
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;