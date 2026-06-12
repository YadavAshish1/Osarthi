import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import taxonomyRoutes from './routes/taxonomy.js';
import contentRoutes from './routes/content.js';
import quizRoutes from './routes/quiz.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';
import profileRoutes from './routes/profile.js';
import { getStorageMode, isCloudinaryEnabled } from './services/storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

await connectDB();

// Behind Render/other reverse proxies, allow Express to trust X-Forwarded-* headers.
// This is required for express-rate-limit to correctly identify clients.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173' || 'https://osarthi.onrender.com',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

if (!isCloudinaryEnabled()) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/taxonomy', taxonomyRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Osarthi API running on http://localhost:${PORT}`);
  console.log(`Media storage: ${getStorageMode()}`);
});
