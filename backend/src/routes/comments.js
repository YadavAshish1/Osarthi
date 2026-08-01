import { Router } from 'express';
import Comment from '../models/Comment.js';
import Content from '../models/Content.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/comments/blog/:blogId
 * Public — get all comments for a blog (nested: top-level + replies)
 */
router.get('/blog/:blogId', async (req, res, next) => {
  try {
    const { blogId } = req.params;

    // Check if blog exists
    const blog = await Content.findOne({ _id: blogId, published: true });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const allComments = await Comment.find({ blogId })
      .sort({ createdAt: 1 })
      .populate('userId', 'name avatar');

    // Get logged-in user id from Authorization header (optional)
    let currentUserId = null;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../utils/tokens.js');
        const decoded = verifyAccessToken(header.slice(7));
        currentUserId = decoded.userId;
      } catch { /* anonymous */ }
    }

    // Build flat list, then nest replies under parents
    const commentMap = {};
    const roots = [];

    for (const c of allComments) {
      const obj = {
        id: c._id.toString(),
        blog_id: c.blogId.toString(),
        user_id: c.userId?._id?.toString() || '',
        user_name: c.userId?.name || 'Anonymous',
        user_avatar: c.userId?.avatar || null,
        content: c.content,
        parent_id: c.parentId ? c.parentId.toString() : null,
        created_at: c.createdAt,
        likes_count: c.likes.length,
        user_liked: currentUserId ? c.likes.map(l => l.toString()).includes(currentUserId) : false,
        replies: [],
      };
      commentMap[obj.id] = obj;
    }

    for (const obj of Object.values(commentMap)) {
      if (obj.parent_id && commentMap[obj.parent_id]) {
        commentMap[obj.parent_id].replies.push(obj);
      } else {
        roots.push(obj);
      }
    }

    res.json(roots);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/comments/blog/:blogId
 * Auth required — post a comment or reply
 */
router.post('/blog/:blogId', authenticate, async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { content, parent_id } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const blog = await Content.findOne({ _id: blogId, published: true });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (parent_id) {
      const parent = await Comment.findOne({ _id: parent_id, blogId });
      if (!parent) return res.status(404).json({ message: 'Parent comment not found' });
    }

    const comment = await Comment.create({
      blogId,
      userId: req.user._id,
      content: content.trim(),
      parentId: parent_id || null,
    });

    await comment.populate('userId', 'name avatar');

    res.status(201).json({
      id: comment._id.toString(),
      blog_id: comment.blogId.toString(),
      user_id: req.user._id.toString(),
      user_name: comment.userId?.name || req.user.name,
      user_avatar: comment.userId?.avatar || null,
      content: comment.content,
      parent_id: comment.parentId ? comment.parentId.toString() : null,
      created_at: comment.createdAt,
      likes_count: 0,
      user_liked: false,
      replies: [],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/comments/:id
 * Auth required — edit own comment
 */
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    comment.content = content.trim();
    await comment.save();

    res.json({ message: 'Updated', content: comment.content });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/comments/:id
 * Auth required — delete own comment (+ its replies)
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete replies too
    await Comment.deleteMany({ parentId: comment._id });
    await comment.deleteOne();

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/comments/:id/like
 * Auth required — toggle like on a comment
 */
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userId = req.user._id.toString();
    const alreadyLiked = comment.likes.map(l => l.toString()).includes(userId);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(l => l.toString() !== userId);
    } else {
      comment.likes.push(req.user._id);
    }
    await comment.save();

    res.json({ liked: !alreadyLiked, likes_count: comment.likes.length });
  } catch (err) {
    next(err);
  }
});

export default router;
