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
 * GET /api/marketplace/orders
 */
router.get('/orders', requireAuth, async (req, res) => {
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
      buyer_id: req.userId, // ✅ Added buyer_id explicitly
      amount_paid: amountPaid,
      payment_method,
      transaction_ref: transactionRef,
      status: "SUCCESS",
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (payError) return res.status(400).json({ error: payError.message });

  // Update order status
  await req.supabase
    .from("marketplace_orders")
    .update({ payment_status: "PAID" })
    .eq("id", orderId);

  res.status(201).json({ success: true, transaction_ref: transactionRef, payment });
});

export default router;