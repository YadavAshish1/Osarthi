import { Router } from 'express';
import http from 'http';
import { URL } from 'url';
import { authenticate } from '../middleware/auth.js';
import AiSettings from '../models/AiSettings.js';

const router = Router();

// Python AI Agent Service URL
const AI_SERVICE_URL = process.env.AI_AGENT_SERVICE_URL || 'http://localhost:8000';

/**
 * Proxy a request to the Python AI Agent Service.
 * Handles SSE stream passthrough for chat responses.
 * 
 * Addresses Verification Report Issue #6: explicit SSE passthrough
 * with proper header forwarding and stream piping.
 */
function proxyToAgent(req, res, targetPath) {
  const url = new URL(targetPath, AI_SERVICE_URL);

  const options = {
    hostname: url.hostname,
    port: url.port,
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

  const proxyReq = http.request(options, (proxyRes) => {
    // Check if this is an SSE response
    const contentType = proxyRes.headers['content-type'] || '';
    const isSSE = contentType.includes('text/event-stream');

    if (isSSE) {
      // SSE passthrough — critical for immediate token-by-token streaming
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
      });
    } else {
      // Regular JSON response
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
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

  // Handle client disconnect — close the proxy connection
  req.on('close', () => {
    proxyReq.destroy();
  });
}

// ── Rate Limiter for AI Chat ────────────────────────────────────────
// Addresses Verification Report Issue #7: per-user rate limiting

const rateLimitStore = new Map(); // userId -> { count, resetTime }

async function checkRateLimit(req, res, next) {
  const userId = req.user._id.toString();
  const userRole = req.user.role;

  // Load rate limits from AI settings
  let settings;
  try {
    settings = await AiSettings.findOne();
  } catch {
    // Default limits if settings not found
  }

  const limits = settings?.rateLimits || {
    student: 50,
    teacher: 100,
    admin: 500,
    super_admin: -1,
  };

  const limit = limits[userRole] ?? 50;
  if (limit === -1) return next(); // unlimited

  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour

  let entry = rateLimitStore.get(userId);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(userId, entry);
  }

  entry.count++;
  if (entry.count > limit) {
    return res.status(429).json({
      message: `Rate limit exceeded. You can send ${limit} messages per hour.`,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
  }

  next();
}

// ── All AI routes require authentication ────────────────────────────
router.use(authenticate);

/** POST /api/ai/chat — Proxy chat to Python AI Agent Service (SSE) */
router.post('/chat', checkRateLimit, (req, res) => {
  proxyToAgent(req, res, '/api/agent/chat');
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
