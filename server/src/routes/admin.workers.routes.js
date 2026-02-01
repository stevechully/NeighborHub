import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = express.Router();

/**
 * GET /api/admin/workers
 * Admin fetches list of ACTIVE workers
 */
router.get("/workers", requireAuth, async (req, res) => {
  // Verify requester is ADMIN (RLS-safe: check self)
  const { data: roleRow, error: roleErr } = await req.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", req.userId)
    .single();

  if (roleErr) {
    return res.status(400).json({ error: roleErr.message });
  }

  if (roleRow?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }

  // Use admin client to fetch all workers (bypass RLS)
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      `
      id,
      full_name,
      status,
      roles ( name )
    `
    )
    .eq("status", "ACTIVE");

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // filter only WORKER role
  const workers = (data || [])
    .filter((u) => u.roles?.name === "WORKER")
    .map((u) => ({
      id: u.id,
      full_name: u.full_name,
      status: u.status,
    }));

  res.json(workers);
});

export default router;
