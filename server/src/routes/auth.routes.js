import express from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = express.Router();

const ALLOWED_ROLES = ["RESIDENT", "SECURITY", "WORKER", "SELLER"];
// ✅ Allowed worker types for validation
const WORKER_TYPES = ["ELECTRICIAN", "PLUMBER", "CARPENTER", "CLEANER", "GARDENER"];

router.post("/signup", async (req, res) => {
  // ✅ Extract worker_type from body
  const { full_name, email, password, role, worker_type } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: "Invalid role selected" });
  }

  // ✅ Validation for Workers
  if (role === "WORKER") {
    if (!worker_type || !WORKER_TYPES.includes(worker_type)) {
      return res.status(400).json({ error: "Invalid or missing worker type" });
    }
  }

  // 1) Create Supabase Auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  const userId = authData.user.id;

  // 2) Create/Upsert profile
  // ✅ Construct payload dynamically to include worker_type if applicable
  const profilePayload = {
    id: userId,
    full_name,
    status: "ACTIVE",
  };

  if (role === "WORKER") {
    profilePayload.worker_type = worker_type;
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    return res.status(400).json({ error: profileError.message });
  }

  // 3) Assign role via profiles.role_id
  const systemRole = role === "SELLER" ? "RESIDENT" : role;

  const { data: roleRow, error: roleFetchError } = await supabaseAdmin
    .from("roles")
    .select("id, name")
    .eq("name", systemRole)
    .single();

  if (roleFetchError || !roleRow) {
    return res.status(400).json({ error: "Role not found in roles table" });
  }

  const { error: profileRoleError } = await supabaseAdmin
    .from("profiles")
    .update({ role_id: roleRow.id })
    .eq("id", userId);

  if (profileRoleError) {
    return res.status(400).json({ error: profileRoleError.message });
  }

  // 4) If SELLER → create marketplace seller row (pending approval)
  if (role === "SELLER") {
    const { error: sellerError } = await supabaseAdmin
      .from("marketplace_sellers")
      .upsert(
        {
          seller_id: userId,
          is_approved: false,
        },
        { onConflict: "seller_id" }
      );

    if (sellerError) {
      return res.status(400).json({
        error: "Failed to create seller profile: " + sellerError.message,
      });
    }
  }

  res.status(201).json({
    success: true,
    user_id: userId,
    message: "Signup successful ✅ Please login now.",
  });
});

export default router;