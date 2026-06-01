import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadMedia, getStorageMode } from '../services/storage.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|webm|pdf)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

const router = Router();

router.get('/config', authenticate, (_req, res) => {
  res.json({ storage: getStorageMode() });
});

router.post('/', authenticate, requireRole('teacher'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const result = await uploadMedia(req.file, { userId: req.user._id.toString() });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
