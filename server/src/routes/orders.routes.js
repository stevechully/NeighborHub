import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * POST /api/orders
 * Create a new order for any module
 */
router.post("/", requireAuth, async (req, res) => {

  try {

    const { module, reference_id, amount } = req.body;

    if (!module || !reference_id || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await req.supabase
      .from("orders")
      .insert({
        user_id: req.userId,
        module,
        reference_id,
        amount,
        status: "PENDING"
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (err) {

    console.error("ORDER CREATE ERROR:", err.message);
    res.status(500).json({ error: err.message });

  }

});

export default router;