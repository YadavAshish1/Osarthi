import { Router } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import { uploadMedia } from '../services/storage.js';
import User from '../models/User.js';
import Content from '../models/Content.js';
import Comment from '../models/Comment.js';

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 }, // 500 KB limit for profile photo
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('Only image files are allowed (JPG, PNG, GIF, WEBP)'));
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

/** POST /api/profile/avatar — upload profile photo (max 500 KB) */
router.post(
  '/avatar',
  (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Profile picture size must not exceed 500 KB' });
        }
        return res.status(400).json({ message: err.message || 'Image upload failed' });
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No image file uploaded' });

      if (req.file.size > 500 * 1024) {
        return res.status(400).json({ message: 'Profile picture size must not exceed 500 KB' });
      }

      const result = await uploadMedia(req.file, { userId: req.user._id.toString(), folder: 'avatars' });

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: result.url } },
        { new: true }
      ).select('-passwordHash -refreshTokenHash -googleId');

      res.json({ avatar: user.avatar, message: 'Profile picture updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

/** DELETE /api/profile/avatar — remove profile photo */
router.delete('/avatar', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: '' } },
      { new: true }
    ).select('-passwordHash -refreshTokenHash -googleId');

    res.json({ avatar: '', message: 'Profile picture removed successfully' });
  } catch (err) {
    next(err);
  }
});

/** GET /api/profile/bookmarks — list saved blogs for current user */
router.get('/bookmarks', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const savedIds = user.savedBlogs || [];
    const validMongoIds = savedIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const blogs = await Content.find({ _id: { $in: validMongoIds } })
      .populate('createdBy', 'name avatar')
      .populate('classRef', 'name')
      .populate('subjectRef', 'name')
      .populate('topicRef', 'name');

    res.json(blogs || []);
  } catch (err) {
    next(err);
  }
});

/** POST /api/profile/bookmarks/toggle — toggle save/bookmark a blog */
router.post('/bookmarks/toggle', async (req, res, next) => {
  try {
    const { blogId } = req.body;
    if (!blogId) return res.status(400).json({ message: 'blogId is required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isAlreadySaved = user.savedBlogs?.some((id) => id.toString() === blogId.toString());

    if (isAlreadySaved) {
      user.savedBlogs = user.savedBlogs.filter((id) => id.toString() !== blogId.toString());
    } else {
      if (!user.savedBlogs) user.savedBlogs = [];
      user.savedBlogs.push(blogId);
    }

    await user.save();

    if (mongoose.Types.ObjectId.isValid(blogId)) {
      const inc = isAlreadySaved ? -1 : 1;
      await Content.findByIdAndUpdate(blogId, { $inc: { bookmarksCount: inc } });
    }

    res.json({
      saved: !isAlreadySaved,
      message: !isAlreadySaved ? 'Saved to bookmarks' : 'Removed from bookmarks',
      savedBlogs: user.savedBlogs,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/profile/activity — list saved, liked, and commented blogs for current user */
router.get('/activity', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const savedIds = (user.savedBlogs || []).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const likedIds = (user.likedBlogs || []).filter((id) => mongoose.Types.ObjectId.isValid(id));

    // Get all unique blogIds where current user has commented
    const userCommentBlogIds = await Comment.find({ userId: req.user._id }).distinct('blogId');
    const commentedIds = userCommentBlogIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const populateFields = [
      { path: 'createdBy', select: 'name avatar' },
      { path: 'classRef', select: 'name' },
      { path: 'subjectRef', select: 'name' },
      { path: 'topicRef', select: 'name' },
    ];

    const [savedBlogs, likedBlogs, commentedBlogs] = await Promise.all([
      Content.find({ _id: { $in: savedIds } }).populate(populateFields),
      Content.find({ _id: { $in: likedIds } }).populate(populateFields),
      Content.find({ _id: { $in: commentedIds } }).populate(populateFields),
    ]);

    res.json({
      savedBlogs: savedBlogs || [],
      likedBlogs: likedBlogs || [],
      commentedBlogs: commentedBlogs || [],
      savedTeachers: user.savedTeachers || [],
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/profile/likes/toggle — toggle liking an insight */
router.post('/likes/toggle', async (req, res, next) => {
  try {
    const { blogId } = req.body;
    if (!blogId) return res.status(400).json({ message: 'blogId is required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isAlreadyLiked = user.likedBlogs?.some((id) => id.toString() === blogId.toString());

    if (isAlreadyLiked) {
      user.likedBlogs = user.likedBlogs.filter((id) => id.toString() !== blogId.toString());
    } else {
      if (!user.likedBlogs) user.likedBlogs = [];
      user.likedBlogs.push(blogId);
    }

    await user.save();

    // Also update likes_count on Content document if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(blogId)) {
      const inc = isAlreadyLiked ? -1 : 1;
      await Content.findByIdAndUpdate(blogId, { $inc: { likes_count: inc, likesCount: inc } });
    }

    res.json({
      liked: !isAlreadyLiked,
      message: !isAlreadyLiked ? 'Appreciated insight' : 'Unliked insight',
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/profile/saved-teachers — list saved/liked teachers for current user */
router.get('/saved-teachers', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const savedTeacherIds = (user.savedTeachers || []).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const teachers = await User.find({ _id: { $in: savedTeacherIds } }).select(
      'name avatar bio education experience createdAt'
    );

    // Aggregate published blogs count per teacher
    const blogsCounts = await Content.aggregate([
      { $match: { published: true, createdBy: { $in: savedTeacherIds } } },
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    for (const b of blogsCounts) {
      if (b._id) countMap.set(b._id.toString(), b.count);
    }

    const result = teachers.map((t) => {
      const obj = t.toObject();
      obj.blogsCount = countMap.get(t._id.toString()) || 0;
      return obj;
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** POST /api/profile/saved-teachers/toggle — toggle save/like a teacher */
router.post('/saved-teachers/toggle', async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ message: 'teacherId is required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isAlreadySaved = user.savedTeachers?.some((id) => id.toString() === teacherId.toString());

    if (isAlreadySaved) {
      user.savedTeachers = user.savedTeachers.filter((id) => id.toString() !== teacherId.toString());
    } else {
      if (!user.savedTeachers) user.savedTeachers = [];
      user.savedTeachers.push(teacherId);
    }

    await user.save();

    res.json({
      saved: !isAlreadySaved,
      message: !isAlreadySaved ? 'Added teacher to your saved mentors' : 'Removed teacher from your saved mentors',
      savedTeachers: user.savedTeachers,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
