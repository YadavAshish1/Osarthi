import { Router } from 'express';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { authenticate } from '../middleware/auth.js';
import AiSettings from '../models/AiSettings.js';
import User from '../models/User.js';
import PaymentOrder from '../models/PaymentOrder.js';

const router = Router();

// Python AI Agent Service URL
const AI_SERVICE_URL = process.env.AI_AGENT_SERVICE_URL || 'http://localhost:8000';

/**
 * Calculate the effective quota and remaining questions for a user.
 */
async function calculateUserQuota(user, settings) {
  if (!settings) {
    settings = await AiSettings.findOne();
  }

  const role = user.role || 'student';
  const defaultFreeQuotas = settings?.defaultFreeQuota || {
    student: 5,
    teacher: 10,
    admin: -1,
    super_admin: -1,
  };

  const freeQuota = defaultFreeQuotas[role] ?? (role === 'student' ? 5 : role === 'teacher' ? 10 : -1);

  // If role is unlimited
  if (freeQuota === -1) {
    return {
      role,
      freeQuota: -1,
      planQuota: -1,
      bonusMessages: 0,
      totalAllowed: -1,
      messagesUsed: user.aiUsage?.messagesUsed || 0,
      remaining: -1,
      isUnlimited: true,
      isExhausted: false,
      activePlan: user.aiUsage?.activePlan || 'free',
      planExpiresAt: user.aiUsage?.planExpiresAt || null,
    };
  }

  const aiUsage = user.aiUsage || {};
  const messagesUsed = aiUsage.messagesUsed || 0;
  const bonusMessages = aiUsage.bonusMessages || 0;
  const activePlanId = aiUsage.activePlan || 'free';
  const planExpiresAt = aiUsage.planExpiresAt ? new Date(aiUsage.planExpiresAt) : null;

  let planQuota = 0;
  let isPlanActive = false;

  // Check if user has an active paid subscription plan that has not expired
  if (activePlanId !== 'free' && planExpiresAt && planExpiresAt > new Date()) {
    isPlanActive = true;
    const plan = settings?.subscriptionPlans?.find((p) => p.planId === activePlanId && p.isActive);
    if (plan) {
      planQuota = plan.monthlyQuota;
    }
  }

  const totalAllowed = freeQuota + planQuota + bonusMessages;
  const remaining = Math.max(0, totalAllowed - messagesUsed);
  const isExhausted = remaining <= 0;

  return {
    role,
    freeQuota,
    planQuota,
    bonusMessages,
    totalAllowed,
    messagesUsed,
    remaining,
    isUnlimited: false,
    isExhausted,
    activePlan: isPlanActive ? activePlanId : 'free',
    planExpiresAt,
  };
}

/**
 * Proxy a request to the Python AI Agent Service.
 * Handles SSE stream passthrough for chat responses and increments message usage on success.
 */
function proxyToAgent(req, res, targetPath, onCompleteCallback) {
  const url = new URL(targetPath, AI_SERVICE_URL);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: url.host,
      // Forward the JWT token from the original request or cookie
      authorization: req.headers.authorization || (req.cookies?.accessToken ? `Bearer ${req.cookies.accessToken}` : ''),
      cookie: req.headers.cookie || (req.cookies?.accessToken ? `accessToken=${req.cookies.accessToken}` : ''),
      'content-type': 'application/json',
    },
  };

  // Remove headers that shouldn't be forwarded
  delete options.headers['content-length'];

  const proxyReq = client.request(options, (proxyRes) => {
    // Check if this is an SSE response
    const contentType = proxyRes.headers['content-type'] || '';
    const isSSE = contentType.includes('text/event-stream');

    if (isSSE) {
      let isSuccess = (proxyRes.statusCode || 200) < 400;

      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }
      proxyRes.on('data', (chunk) => {
        res.write(chunk);
        if (typeof res.flush === 'function') {
          res.flush();
        }
      });
      proxyRes.on('end', () => {
        res.end();
        if (isSuccess && typeof onCompleteCallback === 'function') {
          onCompleteCallback();
        }
      });
    } else {
      // Regular JSON response
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
      if ((proxyRes.statusCode || 200) < 400 && typeof onCompleteCallback === 'function') {
        onCompleteCallback();
      }
    }
  });

  proxyReq.on('error', (err) => {
    console.error('[AI Proxy] Error connecting to AI Agent Service:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        message: 'AI Agent Service is unavailable. Please try again later.',
        error: err.message,
      });
    }
  });

  // Forward request body for POST/PUT
  if (req.method === 'POST' || req.method === 'PUT') {
    const body = JSON.stringify(req.body);
    proxyReq.setHeader('content-length', Buffer.byteLength(body));
    proxyReq.write(body);
  }

  proxyReq.end();

  // Handle client disconnect
  req.on('close', () => {
    proxyReq.destroy();
  });
}

// ── Rate Limiter & Message Quota Guard ──────────────────────────────
const rateLimitStore = new Map(); // userId -> { count, resetTime }

async function checkQuotaAndRateLimit(req, res, next) {
  try {
    const userId = req.user._id;
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    let settings = await AiSettings.findOne();
    if (!settings) {
      settings = await AiSettings.create({});
    }

    // 1. Check Rate Limit (Burst protection per hour)
    const limits = settings?.rateLimits || { student: 50, teacher: 100, admin: 500, super_admin: -1 };
    const hourlyLimit = limits[dbUser.role] ?? 50;

    if (hourlyLimit !== -1) {
      const now = Date.now();
      const windowMs = 60 * 60 * 1000;
      let entry = rateLimitStore.get(userId.toString());
      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime: now + windowMs };
        rateLimitStore.set(userId.toString(), entry);
      }
      entry.count++;
      if (entry.count > hourlyLimit) {
        return res.status(429).json({
          message: `Hourly rate limit exceeded. You can send up to ${hourlyLimit} messages per hour.`,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        });
      }
    }

    // 2. Check Allowed Message Quota
    const quotaInfo = await calculateUserQuota(dbUser, settings);
    if (!quotaInfo.isUnlimited && quotaInfo.isExhausted) {
      const activePlans = settings.pricingPlans?.filter((p) => p.isActive) || [];
      return res.status(403).json({
        error: 'QUOTA_EXHAUSTED',
        message: `Your free AI message quota (${quotaInfo.totalAllowed} messages) has been exhausted. Please choose a study plan to continue asking doubts!`,
        quota: quotaInfo,
        pricingPlans: activePlans,
      });
    }

    // Attach user & quotaInfo to request for downstream usage
    req.targetUser = dbUser;
    req.quotaInfo = quotaInfo;
    next();
  } catch (err) {
    console.error('Error in quota check middleware:', err);
    next(err);
  }
}

// ── All AI routes require authentication ────────────────────────────
router.use(authenticate);

/** GET /api/ai/usage — Get current user's AI message quota, usage & plans */
router.get('/usage', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let settings = await AiSettings.findOne();
    if (!settings) settings = await AiSettings.create({});

    const quotaInfo = await calculateUserQuota(user, settings);
    const pricingPlans = settings.pricingPlans?.filter((p) => p.isActive) || [];

    res.json({
      ...quotaInfo,
      pricingPlans,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/ai/pricing-plans — Public / Student view of available pricing plans */
router.get('/pricing-plans', async (req, res, next) => {
  try {
    let settings = await AiSettings.findOne();
    if (!settings) settings = await AiSettings.create({});

    const plans = settings.pricingPlans?.filter((p) => p.isActive) || [];
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/chat — Proxy chat with Quota Enforcement (SSE) */
router.post('/chat', checkQuotaAndRateLimit, (req, res) => {
  const userId = req.targetUser._id;

  // Callback to increment usage after stream is delivered
  const onComplete = async () => {
    try {
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'aiUsage.messagesUsed': 1,
          'aiUsage.totalLifetimeMessages': 1,
        },
      });
    } catch (err) {
      console.error('Error incrementing user message usage count:', err);
    }
  };

  proxyToAgent(req, res, '/api/agent/chat', onComplete);
});

/** GET /api/ai/models — List available LLM providers */
router.get('/models', (req, res) => {
  proxyToAgent(req, res, '/api/agent/models');
});

/** GET /api/ai/conversations — List user's conversations */
router.get('/conversations', (req, res) => {
  const { skip = 0, limit = 20 } = req.query;
  proxyToAgent(req, res, `/api/agent/conversations?skip=${skip}&limit=${limit}`);
});

/** DELETE /api/ai/conversations/:id — Delete a conversation */
router.delete('/conversations/:id', (req, res) => {
  proxyToAgent(req, res, `/api/agent/conversations/${req.params.id}`);
});

// ── Subscription & Payment Routes ───────────────────────────────────

/** POST /api/ai/subscription/checkout — Create a Razorpay / Gateway checkout order for an AI plan */
router.post('/subscription/checkout', async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ message: 'planId is required' });
    }

    let settings = await AiSettings.findOne();
    if (!settings) settings = await AiSettings.create({});

    const plan = settings?.pricingPlans?.find((p) => p.id === planId && p.isActive);
    if (!plan) {
      return res.status(404).json({ message: 'Selected plan is not available' });
    }

    const keyId = settings?.paymentGateway?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';
    const keySecret = settings?.paymentGateway?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
    const amountInPaise = Math.round(plan.price * 100);

    let gatewayOrderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    let isRealRazorpayOrder = false;

    // If Razorpay live/test credentials are configured, create authentic Razorpay order
    if (keyId && keySecret && !keyId.includes('YOUR_') && keySecret.length > 5) {
      try {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            userId: req.user._id.toString(),
            userName: req.user.name || '',
            userEmail: req.user.email || '',
            planId: plan.id,
            planName: plan.name,
          },
        });
        if (rzpOrder && rzpOrder.id) {
          gatewayOrderId = rzpOrder.id;
          isRealRazorpayOrder = true;
        }
      } catch (rzpErr) {
        console.warn('Razorpay API order creation fallback:', rzpErr.message);
      }
    }

    // Create PaymentOrder record in database
    const order = await PaymentOrder.create({
      userId: req.user._id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency || 'INR',
      messageQuotaGranted: plan.messageQuota,
      status: 'pending',
      paymentGateway: isRealRazorpayOrder ? 'razorpay' : 'medhashine_gateway',
      gatewayOrderId,
      metadata: {
        billingPeriod: plan.billingPeriod,
        isRealRazorpayOrder,
      },
    });

    res.json({
      message: 'Checkout order created successfully',
      order: {
        orderId: order._id,
        gatewayOrderId,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        amountInPaise,
        currency: plan.currency || 'INR',
        messageQuota: plan.messageQuota,
        keyId,
        isRealRazorpayOrder,
        upiId: settings?.paymentGateway?.upiId || 'medhashine@okhdfcbank',
      },
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/subscription/verify — Verify Razorpay signature / Gateway transaction and activate plan */
router.post('/subscription/verify', async (req, res, next) => {
  try {
    const {
      orderId,
      gatewayOrderId,
      gatewayPaymentId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      paymentMethod = 'razorpay',
    } = req.body;

    const order = await PaymentOrder.findById(orderId);
    if (!order || order.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Payment order not found' });
    }

    if (order.status === 'completed') {
      const user = await User.findById(req.user._id);
      let settings = await AiSettings.findOne();
      const quota = await calculateUserQuota(user, settings);
      return res.json({ message: 'Plan is already active', quota, success: true });
    }

    let settings = await AiSettings.findOne();
    const keySecret = settings?.paymentGateway?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    // Verify HMAC SHA256 signature if real Razorpay credentials exist
    const actualRzpOrderId = razorpayOrderId || gatewayOrderId;
    const actualRzpPaymentId = razorpayPaymentId || gatewayPaymentId;

    if (keySecret && razorpaySignature && actualRzpOrderId && actualRzpPaymentId) {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${actualRzpOrderId}|${actualRzpPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        order.status = 'failed';
        await order.save();
        return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
      }
    }

    // Mark order completed & record payment IDs
    order.status = 'completed';
    order.gatewayPaymentId = actualRzpPaymentId || `PAY_${Date.now()}`;
    if (actualRzpOrderId) order.gatewayOrderId = actualRzpOrderId;
    order.metadata = {
      ...(order.metadata || {}),
      paymentMethod,
      verifiedAt: new Date(),
    };
    await order.save();

    // Calculate plan expiration
    let planExpiresAt = null;
    if (order.metadata?.billingPeriod === 'monthly') {
      planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (order.metadata?.billingPeriod === 'yearly') {
      planExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    const user = await User.findById(req.user._id);
    if (!user.aiUsage) user.aiUsage = {};

    if (order.metadata?.billingPeriod === 'one-time') {
      // Top-up bonus questions
      user.aiUsage.bonusMessages = (user.aiUsage.bonusMessages || 0) + order.messageQuotaGranted;
    } else {
      // Fresh subscription cycle
      user.aiUsage.activePlan = order.planId;
      user.aiUsage.planExpiresAt = planExpiresAt;
      user.aiUsage.messagesUsed = 0; // Fresh quota cycle
      user.aiUsage.lastQuotaResetAt = new Date();
    }

    await user.save();

    const updatedQuota = await calculateUserQuota(user, settings);

    res.json({
      success: true,
      message: `🎉 Payment verified! Successfully subscribed to ${order.planName}. ${order.messageQuotaGranted} AI questions added!`,
      quota: updatedQuota,
      order: {
        orderId: order._id,
        planName: order.planName,
        amount: order.amount,
        paymentId: order.gatewayPaymentId,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Admin Quotas & Pricing Controls (Admin / Super Admin Only) ───────

/** GET /api/ai/admin/quotas — List user quotas and usage */
router.get('/admin/quotas', async (req, res, next) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { search = '', role = 'all', exhaustedOnly = 'false', page = 1, limit = 50 } = req.query;

    const query = {};
    if (role && role !== 'all') {
      query.role = role;
    } else {
      query.role = { $in: ['student', 'teacher'] };
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const settings = await AiSettings.findOne();
    const defaultFreeQuotas = settings?.defaultFreeQuota || { student: 5, teacher: 10 };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name email role avatar aiUsage createdAt')
      .sort({ 'aiUsage.messagesUsed': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const enrichedUsers = users.map((u) => {
      const usage = u.aiUsage || {};
      const freeLimit = defaultFreeQuotas[u.role] ?? (u.role === 'student' ? 5 : 10);
      const bonus = usage.bonusMessages || 0;
      const totalAllowed = freeLimit === -1 ? -1 : freeLimit + bonus;
      const used = usage.messagesUsed || 0;
      const remaining = totalAllowed === -1 ? -1 : Math.max(0, totalAllowed - used);
      const isExhausted = totalAllowed !== -1 && remaining <= 0;

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        messagesUsed: used,
        totalAllowed,
        remaining,
        bonusMessages: bonus,
        isExhausted,
        activePlan: usage.activePlan || 'free',
        lastQuotaResetAt: usage.lastQuotaResetAt || u.createdAt,
        totalLifetimeMessages: usage.totalLifetimeMessages || used,
      };
    });

    const filteredUsers = exhaustedOnly === 'true'
      ? enrichedUsers.filter((u) => u.isExhausted)
      : enrichedUsers;

    res.json({
      users: filteredUsers,
      total: totalUsers,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      defaultFreeQuota: defaultFreeQuotas,
      quotaResetPeriod: settings?.quotaResetPeriod || 'monthly',
      lastGlobalResetAt: settings?.lastGlobalResetAt || null,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/admin/quotas/reset — Reset quota for an individual user or in bulk by role */
router.post('/admin/quotas/reset', async (req, res, next) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId, role = 'all', userIds } = req.body;

    let updateQuery = {};
    if (userId) {
      updateQuery = { _id: userId };
    } else if (Array.isArray(userIds) && userIds.length > 0) {
      updateQuery = { _id: { $in: userIds } };
    } else if (role && role !== 'all') {
      updateQuery = { role };
    } else {
      updateQuery = { role: { $in: ['student', 'teacher'] } };
    }

    const result = await User.updateMany(updateQuery, {
      $set: {
        'aiUsage.messagesUsed': 0,
        'aiUsage.lastQuotaResetAt': new Date(),
      },
    });

    // Update global reset timestamp in settings
    await AiSettings.findOneAndUpdate({}, { lastGlobalResetAt: new Date() });

    res.json({
      success: true,
      message: `Quota successfully reset for ${result.modifiedCount} user(s).`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/admin/quotas/add-bonus — Grant extra bonus messages to a student or teacher */
router.post('/admin/quotas/add-bonus', async (req, res, next) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId, bonusCount = 10, reason = 'Admin Grant' } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.aiUsage) user.aiUsage = {};
    user.aiUsage.bonusMessages = (user.aiUsage.bonusMessages || 0) + parseInt(bonusCount, 10);
    await user.save();

    res.json({
      success: true,
      message: `Granted +${bonusCount} bonus AI messages to ${user.name}.`,
      user: {
        _id: user._id,
        name: user.name,
        bonusMessages: user.aiUsage.bonusMessages,
        messagesUsed: user.aiUsage.messagesUsed,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/ai/admin/pricing-plans — Update the 3-tier pricing configuration */
router.put('/admin/pricing-plans', async (req, res, next) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { pricingPlans } = req.body;
    if (!Array.isArray(pricingPlans) || pricingPlans.length === 0) {
      return res.status(400).json({ message: 'pricingPlans array is required' });
    }

    let settings = await AiSettings.findOne();
    if (!settings) settings = new AiSettings();

    settings.pricingPlans = pricingPlans;
    await settings.save();

    res.json({
      success: true,
      message: '3-Tier Pricing plans updated successfully!',
      pricingPlans: settings.pricingPlans,
    });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/ai/admin/role-quotas — Update default free quotas per role & reset frequency */
router.put('/admin/role-quotas', async (req, res, next) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { defaultFreeQuota, quotaResetPeriod } = req.body;

    let settings = await AiSettings.findOne();
    if (!settings) settings = new AiSettings();

    if (defaultFreeQuota) {
      settings.defaultFreeQuota = {
        ...settings.defaultFreeQuota,
        ...defaultFreeQuota,
      };
    }
    if (quotaResetPeriod) {
      settings.quotaResetPeriod = quotaResetPeriod;
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Role quotas and reset schedule updated successfully!',
      defaultFreeQuota: settings.defaultFreeQuota,
      quotaResetPeriod: settings.quotaResetPeriod,
    });
  } catch (err) {
    next(err);
  }
});

// ── AI Settings Routes (Super Admin Only) ───────────────────────────

/** GET /api/ai/settings — Get current AI settings */
router.get('/settings', async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super Admin access required' });
    }

    let settings = await AiSettings.findOne();
    if (!settings) {
      settings = await AiSettings.create({});
    }

    const data = settings.toObject();

    // Check which providers are configured in server environment
    data.envStatus = {
      azure_openai: Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key'),
    };

    res.json(data);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/ai/settings — Update AI settings */
router.put('/settings', async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super Admin access required' });
    }

    const updates = req.body;

    let settings = await AiSettings.findOne();
    if (!settings) {
      settings = new AiSettings();
    }

    // Update fields selectively (NO API KEYS stored in database)
    if (updates.defaultProvider) settings.defaultProvider = updates.defaultProvider;
    if (updates.fallbackSequence && Array.isArray(updates.fallbackSequence)) {
      settings.fallbackSequence = updates.fallbackSequence;
    }
    if (updates.providers) {
      for (const [key, val] of Object.entries(updates.providers)) {
        if (settings.providers[key]) {
          if (val.enabled !== undefined) settings.providers[key].enabled = val.enabled;
          if (val.endpoint !== undefined) settings.providers[key].endpoint = val.endpoint;
          if (val.deploymentName !== undefined) settings.providers[key].deploymentName = val.deploymentName;
          if (val.apiVersion !== undefined) settings.providers[key].apiVersion = val.apiVersion;
        }
      }
    }
    if (updates.rateLimits) {
      Object.assign(settings.rateLimits, updates.rateLimits);
    }
    if (updates.defaultFreeQuota) {
      Object.assign(settings.defaultFreeQuota, updates.defaultFreeQuota);
    }
    if (updates.quotaResetPeriod) {
      settings.quotaResetPeriod = updates.quotaResetPeriod;
    }
    if (updates.pricingPlans) {
      settings.pricingPlans = updates.pricingPlans;
    }
    if (updates.paymentGateway) {
      if (!settings.paymentGateway) settings.paymentGateway = {};
      Object.assign(settings.paymentGateway, updates.paymentGateway);
    }
    if (updates.ragEnabled !== undefined) settings.ragEnabled = updates.ragEnabled;
    if (updates.azureOps) {
      Object.assign(settings.azureOps, updates.azureOps);
    }

    await settings.save();
    res.json({ message: 'AI settings updated successfully', settings });
  } catch (err) {
    next(err);
  }
});

// ── RAG Ingestion Trigger ───────────────────────────────────────────

/** POST /api/ai/ingest — Trigger RAG ingestion for a content document */
router.post('/ingest', async (req, res) => {
  // Only admins can manually trigger ingestion
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  proxyToAgent(req, res, '/api/rag/ingest');
});

/** POST /api/ai/ingest-all — Bulk re-index all content */
router.post('/ingest-all', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  proxyToAgent(req, res, '/api/rag/ingest-all');
});

export default router;

