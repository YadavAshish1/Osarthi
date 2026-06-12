import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { uploadMedia } from '../services/storage.js';
import User from '../models/User.js';

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for avatars
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

/** GET /api/profile — return current user profile */
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash -refreshTokenHash -googleId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/profile — update name, bio, education, experience */
router.put('/', async (req, res, next) => {
  try {
    const { name, bio, education, experience } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio;
    if (education !== undefined) updates.education = education;
    if (experience !== undefined) updates.experience = experience;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshTokenHash -googleId');

    res.json(user);
  } catch (err) {
    next(err);
  }
});

/** POST /api/profile/avatar — upload profile photo */
router.post('/avatar', upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const result = await uploadMedia(req.file, { userId: req.user._id.toString(), folder: 'avatars' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: result.url } },
      { new: true }
    ).select('-passwordHash -refreshTokenHash -googleId');

    res.json({ avatar: user.avatar });
  } catch (err) {
    next(err);
  }
});

export default router;
