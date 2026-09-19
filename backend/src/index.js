import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {
  authLimiter,
  formSubmitLimiter,
  commentLimiter,
} from './middleware/rateLimiter.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import taxonomyRoutes, { seedDefaultTaxonomy } from './routes/taxonomy.js';
import contentRoutes from './routes/content.js';
import quizRoutes from './routes/quiz.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';
import profileRoutes from './routes/profile.js';
import exploreRoutes from './routes/explore.js';
import commentsRoutes from './routes/comments.js';
import contactRoutes from './routes/contact.js';
import teacherApplicationRoutes from './routes/teacherApplications.js';
import superAdminRoutes, { seedSuperAdmin } from './routes/superAdmin.js';
import taxonomyRequestRoutes from './routes/taxonomyRequests.js';
import supportTicketRoutes from './routes/supportTicket.js';
import { getStorageMode, isCloudinaryEnabled } from './services/storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

await connectDB();
await seedSuperAdmin();
await seedDefaultTaxonomy();

// Behind Render/other reverse proxies, allow Express to trust X-Forwarded-* headers.
// This is required for express-rate-limit to correctly identify clients.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://osarthi.onrender.com'
];

const envUrlVars = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.STUDENT_PORTAL_URL,
  process.env.ADMIN_URL,
];

envUrlVars.forEach((envVar) => {
  if (envVar) {
    envVar.split(',').forEach((url) => {
      const cleanUrl = url.trim().replace(/\/+$/, '');
      if (cleanUrl && !allowedOrigins.includes(cleanUrl)) {
        allowedOrigins.push(cleanUrl);
      }
    });
  }
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or server-to-server curl)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-portal', 'X-Requested-With'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ─── CSRF Protection for Cross-Domain Deployments ───────────────────────────
// Since frontend and backend live on different domains, cookies use SameSite=None; Secure.
// To prevent CSRF attacks from malicious third-party origins, verify Origin/Referer
// on all state-changing HTTP methods (POST, PUT, PATCH, DELETE).
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  if (origin) {
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(cleanOrigin)) {
      return next();
    }
    return res.status(403).json({ message: 'CSRF Protection: Origin not authorized' });
  }

  const referer = req.headers.referer;
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(refererOrigin)) {
        return next();
      }
      return res.status(403).json({ message: 'CSRF Protection: Referer not authorized' });
    } catch {
      return res.status(403).json({ message: 'CSRF Protection: Invalid Referer header' });
    }
  }

  // In production, reject state-changing requests with auth cookies if neither Origin nor Referer is provided
  const hasAuthCookie = req.cookies?.accessToken || req.cookies?.refreshToken || req.cookies?.adminAccessToken || req.cookies?.studentAccessToken;
  if (process.env.NODE_ENV === 'production' && hasAuthCookie) {
    return res.status(403).json({ message: 'CSRF Protection: Origin or Referer header required for authenticated requests' });
  }

  next();
});

if (!isCloudinaryEnabled()) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/taxonomy', taxonomyRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/comments', commentLimiter, commentsRoutes);
app.use('/api/contact', formSubmitLimiter, contactRoutes);
app.use('/api/teacher-applications', teacherApplicationRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/taxonomy-requests', taxonomyRequestRoutes);
app.use('/api/support', formSubmitLimiter, supportTicketRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Osarthi API running on http://localhost:${PORT}`);
  console.log(`Media storage: ${getStorageMode()}`);
});
