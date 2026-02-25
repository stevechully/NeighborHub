import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * Helper: Check if user is ADMIN
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
 * GET /api/refunds
 * Admin fetches all refund requests
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    if (!(await isAdmin(req.supabase, req.userId))) {
      return res.status(403).json({ error: "Admin only" });
    }

    const { status } = req.query;

    let query = req.supabase
      .from("refunds")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch refunds" });
  }
});

/**
 * POST /api/refunds/facility/request
 */
router.post("/facility/request", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { payment_id, reason } = req.body;

    const { data: payment, error } = await req.supabase
      .from("facility_payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (!payment || error) return res.status(404).json({ error: "Payment not found" });
    if (payment.resident_id !== userId) return res.status(403).json({ error: "Not allowed" });
    if (payment.refund_status !== "NONE") return res.status(400).json({ error: "Refund already processed" });

    const { data: refund, error: refundError } = await req.supabase
      .from("refunds")
      .insert({
        payment_type: "FACILITY",
        payment_id,
        user_id: userId,
        original_amount: payment.amount_paid,
        refund_amount: payment.amount_paid,
        reason,
        status: 'PENDING'
      })
      .select().single();

    if (refundError) throw refundError;

    await req.supabase
      .from("facility_payments")
      .update({ refund_status: "REQUESTED" })
      .eq("id", payment_id);

    res.status(201).json(refund);
  } catch (err) {
    res.status(500).json({ error: "Refund request failed" });
  }
});

/**
 * POST /api/refunds/event/request
 */
router.post("/event/request", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { payment_id, reason } = req.body;

    const { data: payment, error } = await req.supabase
      .from("event_payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (!payment || error) return res.status(404).json({ error: "Payment not found" });
    if (payment.user_id !== userId) return res.status(403).json({ error: "Not allowed" });
    if (payment.refund_status !== "NONE") return res.status(400).json({ error: "Refund already requested" });

    const { data: refund, error: refundError } = await req.supabase
      .from("refunds")
      .insert({
        payment_type: "EVENT",
        payment_id,
        user_id: userId,
        original_amount: payment.amount_paid,
        refund_amount: payment.amount_paid,
        reason,
        status: 'PENDING'
      })
      .select().single();

    if (refundError) throw refundError;

    await req.supabase
      .from("event_payments")
      .update({ refund_status: "REQUESTED" })
      .eq("id", payment_id);

    res.status(201).json(refund);
  } catch (err) {
    res.status(500).json({ error: "Event refund request failed" });
  }
});

/**
 * POST /api/refunds/worker/request
 */
router.post("/worker/request", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { payment_id, reason } = req.body;

    const { data: payment, error } = await req.supabase
      .from("worker_payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (!payment || error) return res.status(404).json({ error: "Payment not found" });
    if (payment.resident_id !== userId) return res.status(403).json({ error: "Not allowed" });
    if (payment.refund_status !== "NONE") return res.status(400).json({ error: "Refund already requested" });

    const { data: refund, error: refundError } = await req.supabase
      .from("refunds")
      .insert({
        payment_type: "WORKER",
        payment_id,
        user_id: userId,
        original_amount: payment.amount_paid,
        refund_amount: payment.amount_paid,
        reason,
        status: 'PENDING'
      })
      .select().single();

    if (refundError) throw refundError;

    await req.supabase
      .from("worker_payments")
      .update({ refund_status: "REQUESTED" })
      .eq("id", payment_id);

    res.status(201).json(refund);
  } catch (err) {
    res.status(500).json({ error: "Worker refund request failed" });
  }
});

/**
 * POST /api/refunds/marketplace/request
 * Resident requests a refund for a Marketplace order
 */
router.post("/marketplace/request", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { payment_id, reason } = req.body;

    const { data: payment, error } = await req.supabase
      .from("marketplace_payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (!payment || error) return res.status(404).json({ error: "Payment not found" });
    if (payment.buyer_id !== userId) return res.status(403).json({ error: "Not allowed" });
    if (payment.refund_status !== "NONE") return res.status(400).json({ error: "Refund already requested" });

    const { data: refund, error: refundError } = await req.supabase
      .from("refunds")
      .insert({
        payment_type: "MARKETPLACE",
        payment_id,
        user_id: userId,
        original_amount: payment.amount_paid,
        refund_amount: payment.amount_paid,
        reason,
        status: 'PENDING'
      })
      .select().single();

    if (refundError) throw refundError;

    await req.supabase
      .from("marketplace_payments")
      .update({ refund_status: "REQUESTED" })
      .eq("id", payment_id);

    res.status(201).json(refund);
  } catch (err) {
    res.status(500).json({ error: "Marketplace refund request failed" });
  }
});

/**
 * PATCH /api/refunds/:id/approve
 */
router.patch("/:id/approve", requireAuth, async (req, res) => {
  try {
    if (!(await isAdmin(req.supabase, req.userId))) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const refundId = req.params.id;
    const { data: refund } = await req.supabase.from("refunds").select("*").eq("id", refundId).single();

    if (!refund || refund.status !== "PENDING") return res.status(400).json({ error: "Invalid refund request" });

    // 1. Mark global refund as completed
    await req.supabase.from("refunds").update({
      status: "COMPLETED",
      processed_by: req.userId,
      processed_at: new Date().toISOString()
    }).eq("id", refundId);

    // 2. Route-specific logic based on payment_type
    if (refund.payment_type === "FACILITY") {
      await req.supabase.from("facility_payments").update({ refund_status: "REFUNDED" }).eq("id", refund.payment_id);
      const { data: pay } = await req.supabase.from("facility_payments").select("booking_id").eq("id", refund.payment_id).single();
      if (pay?.booking_id) {
        await req.supabase.from("facility_bookings").update({ status: "CANCELLED" }).eq("id", pay.booking_id);
      }
    } 
    else if (refund.payment_type === "EVENT") {
      await req.supabase.from("event_payments").update({ refund_status: "REFUNDED" }).eq("id", refund.payment_id);
      const { data: pay } = await req.supabase.from("event_payments").select("registration_id").eq("id", refund.payment_id).single();
      if (pay?.registration_id) {
        await req.supabase.from("event_registrations").update({ status: "CANCELLED" }).eq("id", pay.registration_id);
      }
    }
    else if (refund.payment_type === "WORKER") {
      await req.supabase.from("worker_payments").update({ refund_status: "REFUNDED" }).eq("id", refund.payment_id);
      const { data: pay } = await req.supabase.from("worker_payments").select("booking_id").eq("id", refund.payment_id).single();
      if (pay?.booking_id) {
        await req.supabase.from("worker_bookings").update({ status: "CANCELLED" }).eq("id", pay.booking_id);
      }
    }
    else if (refund.payment_type === "MARKETPLACE") {
      // ✅ FIXED: Perfectly aligned with our frontend order state logic
      await req.supabase.from("marketplace_payments").update({ refund_status: "REFUNDED" }).eq("id", refund.payment_id);
      const { data: pay } = await req.supabase.from("marketplace_payments").select("order_id").eq("id", refund.payment_id).single();
      if (pay?.order_id) {
        await req.supabase.from("marketplace_orders").update({ 
          status: "REFUNDED", 
          payment_status: "REFUNDED" 
        }).eq("id", pay.order_id);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Approval failed" });
  }
});

/**
 * PATCH /api/refunds/:id/reject
 */
router.patch("/:id/reject", requireAuth, async (req, res) => {
  try {
    if (!(await isAdmin(req.supabase, req.userId))) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const refundId = req.params.id;
    const { data: refund } = await req.supabase.from("refunds").select("*").eq("id", refundId).single();

    if (!refund || refund.status !== "PENDING") return res.status(400).json({ error: "Invalid refund request" });

    await req.supabase.from("refunds").update({
      status: "REJECTED",
      processed_by: req.userId,
      processed_at: new Date().toISOString()
    }).eq("id", refundId);

    // Dynamic table selection for resetting status
    let table = "facility_payments";
    if (refund.payment_type === "EVENT") table = "event_payments";
    if (refund.payment_type === "WORKER") table = "worker_payments";
    if (refund.payment_type === "MARKETPLACE") table = "marketplace_payments";
    
    await req.supabase.from(table).update({ refund_status: "NONE" }).eq("id", refund.payment_id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Reject failed" });
  }
});

export default router;