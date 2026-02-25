import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

/* ---------- PRODUCTS ---------- */

/**
 * GET /api/marketplace/products/all
 * Admin fetches ALL products (approved + pending)
 */
router.get("/products/all", requireAuth, async (req, res) => {
  try {
    const { data: roleRow } = await req.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", req.userId)
      .single();

    if (roleRow?.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { data, error } = await req.supabase
      .from("marketplace_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/marketplace/products
 * Fetch approved marketplace products (for Residents/Public)
 */
router.get('/products', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('marketplace_products')
    .select('*')
    .eq('is_approved', true)
    .gt('quantity', 0)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * POST /api/marketplace/products
 * Seller creates a product listing
 */
router.post('/products', requireAuth, async (req, res) => {
  const { name, description, category, price, quantity } = req.body;

  if (!name || !price || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: seller } = await req.supabase
    .from('marketplace_sellers')
    .select('seller_id, is_approved')
    .eq('seller_id', req.userId)
    .single();

  if (!seller) return res.status(403).json({ error: 'User is not a marketplace seller' });
  if (!seller.is_approved) return res.status(403).json({ error: 'Seller not approved yet' });

  const { data, error } = await req.supabase
    .from('marketplace_products')
    .insert({
      seller_id: seller.seller_id,
      name,
      description,
      category,
      price,
      quantity,
      is_approved: false,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * PATCH /api/marketplace/products/:id/approve
 * Admin approves product
 */
router.patch('/products/:id/approve', requireAuth, async (req, res) => {
  const { data: roleRow } = await req.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.userId)
    .single();

  if (roleRow?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { data, error } = await req.supabase
    .from('marketplace_products')
    .update({ is_approved: true })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * PATCH /api/marketplace/products/:id
 * Seller updates own product
 */
router.patch('/products/:id', requireAuth, async (req, res) => {
  const { name, description, category, price, quantity } = req.body;

  const { data: product } = await req.supabase
    .from('marketplace_products')
    .select('seller_id')
    .eq('id', req.params.id)
    .single();

  if (!product || product.seller_id !== req.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { data, error } = await req.supabase
    .from('marketplace_products')
    .update({ name, description, category, price, quantity })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/* ---------- ORDERS ---------- */

/**
 * POST /api/marketplace/orders
 * Resident places an order
 */
router.post('/orders', requireAuth, async (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id || !quantity) return res.status(400).json({ error: 'Missing order details' });

  const { data: product } = await req.supabase
    .from('marketplace_products')
    .select('price, quantity, is_approved, seller_id')
    .eq('id', product_id)
    .single();

  if (!product || !product.is_approved) return res.status(400).json({ error: 'Product not approved' });
  if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  const { data: order, error } = await req.supabase
    .from('marketplace_orders')
    .insert({
      product_id,
      buyer_id: req.userId,
      seller_id: product.seller_id,
      quantity,
      status: 'PLACED',
      payment_status: 'PENDING'
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await req.supabase
    .from('marketplace_products')
    .update({ quantity: product.quantity - quantity })
    .eq('id', product_id);

  res.status(201).json(order);
});

/**
 * GET /api/marketplace/my-orders
 * Buyer fetches their orders merged with payment/refund status
 */
router.get("/my-orders", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Fetch orders for the current resident
    const { data: orders, error: orderError } = await req.supabase
      .from("marketplace_orders")
      .select("*, marketplace_products(name, price)")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });

    if (orderError) return res.status(400).json({ error: orderError.message });

    // 2. Fetch payments for this resident to find refund status
    const { data: payments } = await req.supabase
      .from("marketplace_payments")
      .select("id, order_id, refund_status")
      .eq("buyer_id", userId);

    // 3. Manual merge to ensure frontend stability
    const formatted = orders.map((o) => {
      const payment = payments?.find((p) => p.order_id === o.id);
      return {
        ...o,
        marketplace_payments: payment || null
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET /api/marketplace/orders (Admin view of all)
 */
router.get('/orders', requireAuth, async (req, res) => {
  const { data: roleRow } = await req.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", req.userId)
    .single();

  if (roleRow?.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });

  const { data, error } = await req.supabase
    .from('marketplace_orders')
    .select(`
      *,
      marketplace_products ( name, seller_id, price )
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/* ---------- PAYMENTS ---------- */

/**
 * GET /api/marketplace/payments/my
 * Resident fetches own marketplace payments
 */
router.get("/payments/my", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from("marketplace_payments")
    .select("*")
    .eq("buyer_id", req.userId)
    .order("paid_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * GET /api/marketplace/payments
 * Admin fetches all marketplace payments
 */
router.get("/payments", requireAuth, async (req, res) => {
  const { data: roleRow } = await req.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", req.userId)
    .single();

  if (roleRow?.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });

  const { data, error } = await req.supabase
    .from("marketplace_payments")
    .select("*")
    .order("paid_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * GET /api/marketplace/payments/:id/receipt
 */
router.get("/payments/:id/receipt", requireAuth, async (req, res) => {
  const { data: payment, error } = await req.supabase
    .from("marketplace_payments")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !payment) return res.status(404).json({ error: "Payment not found" });

  if (payment.buyer_id !== req.userId) {
    const { data: roleRow } = await req.supabase.from("user_roles").select("role").eq("user_id", req.userId).single();
    if (roleRow?.role !== "ADMIN") return res.status(403).json({ error: "Access denied" });
  }

  res.json({
    receipt_no: payment.transaction_ref,
    amount_paid: payment.amount_paid,
    payment_method: payment.payment_method,
    paid_at: payment.paid_at,
  });
});

/**
 * POST /api/marketplace/orders/:id/pay
 */
router.post("/orders/:id/pay", requireAuth, async (req, res) => {
  const orderId = req.params.id;
  const { payment_method } = req.body;
  const ALLOWED_METHODS = ["MOCK_UPI", "MOCK_CARD", "CASH", "BANK_TRANSFER"];

  if (!payment_method || !ALLOWED_METHODS.includes(payment_method)) {
    return res.status(400).json({ error: "Invalid payment method" });
  }

  const { data: order, error: orderError } = await req.supabase
    .from("marketplace_orders")
    .select("id, buyer_id, quantity, payment_status, product_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) return res.status(404).json({ error: "Order not found" });
  if (order.buyer_id !== req.userId) return res.status(403).json({ error: "Not your order" });
  if (order.payment_status === "PAID") return res.status(400).json({ error: "Order already paid" });

  const { data: product, error: prodError } = await req.supabase
    .from("marketplace_products")
    .select("price")
    .eq("id", order.product_id)
    .single();

  if (prodError || !product) return res.status(404).json({ error: "Product not found" });

  const amountPaid = Number(product.price) * Number(order.quantity);
  const transactionRef = `MP-${Date.now()}`;

  // Insert payment record
  const { data: payment, error: payError } = await req.supabase
    .from("marketplace_payments")
    .insert({
      order_id: orderId,
      buyer_id: req.userId,
      amount_paid: amountPaid,
      payment_method,
      transaction_ref: transactionRef,
      status: "SUCCESS",
      paid_at: new Date().toISOString(),
      refund_status: 'NONE' 
    })
    .select()
    .single();

  if (payError) return res.status(400).json({ error: payError.message });

  // Update both order status AND payment status
  await req.supabase
    .from("marketplace_orders")
    .update({ 
      payment_status: "PAID",
      status: "PAID" 
    })
    .eq("id", orderId);

  res.status(201).json({ success: true, transaction_ref: transactionRef, payment });
});

/**
 * POST /api/marketplace/payments/:id/refund
 * Resident requests a refund for a paid order
 */
router.post("/payments/:id/refund", requireAuth, async (req, res) => {
  const paymentId = req.params.id;
  const { reason } = req.body;

  // 1. Check if payment exists and belongs to buyer
  const { data: payment, error: payError } = await req.supabase
    .from("marketplace_payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (payError || !payment) return res.status(404).json({ error: "Payment not found" });
  if (payment.buyer_id !== req.userId) return res.status(403).json({ error: "Not your payment" });
  
  // 2. Ensure it hasn't already been refunded or requested
  if (payment.refund_status !== "NONE") {
    return res.status(400).json({ error: "Refund already requested or processed" });
  }

  // 3. Update refund_status to REQUESTED
  const { data, error } = await req.supabase
    .from("marketplace_payments")
    .update({ 
      refund_status: "REQUESTED",
    })
    .eq("id", paymentId)
    .select();

  if (error) return res.status(400).json({ error: error.message });

  // 🚨 Catch the silent failure if Row Level Security (RLS) blocks the update
  if (!data || data.length === 0) {
    return res.status(403).json({ 
      error: "Database blocked the update! Please add an 'UPDATE' RLS policy for marketplace_payments in Supabase." 
    });
  }

  res.json({ success: true, message: "Refund requested successfully", data: data[0] });
});

/**
 * ✅ NEW: POST /api/marketplace/payments/:id/refund/approve
 * Admin approves a refund request
 */
router.post("/payments/:id/refund/approve", requireAuth, async (req, res) => {
  // 1. Verify Admin Role
  const { data: roleRow } = await req.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", req.userId)
    .single();

  if (roleRow?.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });

  const paymentId = req.params.id;

  // 2. Update payment to REFUNDED
  const { data: payment, error: payError } = await req.supabase
    .from("marketplace_payments")
    .update({ refund_status: "REFUNDED" })
    .eq("id", paymentId)
    .select()
    .single();

  if (payError) return res.status(400).json({ error: payError.message });

  // 3. Update the associated order to REFUNDED
  if (payment?.order_id) {
    await req.supabase
      .from("marketplace_orders")
      .update({ 
        payment_status: "REFUNDED", 
        status: "REFUNDED" 
      })
      .eq("id", payment.order_id);
  }

  res.json({ success: true, message: "Refund approved", payment });
});

export default router;