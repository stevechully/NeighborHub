import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

async function isAdmin(supabase, userId) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return data?.role === "ADMIN";
}

/**
 * GET /api/marketplace/sellers
 * Admin fetches all seller requests
 */
router.get("/sellers", requireAuth, async (req, res) => {
  if (!(await isAdmin(req.supabase, req.userId))) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { data, error } = await req.supabase
    .from("marketplace_sellers")
    .select(
      `
      seller_id,
      is_approved,
      created_at,
      profiles:profiles!marketplace_sellers_seller_id_fkey(full_name,email)
    `
    )
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

/**
 * PATCH /api/marketplace/sellers/:id/approve
 * Admin approves a seller
 */
router.patch("/sellers/:id/approve", requireAuth, async (req, res) => {
  const sellerId = req.params.id;

  if (!(await isAdmin(req.supabase, req.userId))) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { data, error } = await req.supabase
    .from("marketplace_sellers")
    .update({ is_approved: true })
    .eq("seller_id", sellerId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

export default router;
