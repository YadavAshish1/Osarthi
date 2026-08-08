import { Router } from 'express';
import Content from '../models/Content.js';
import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Auto cleanup expired bin insights (>30 days retention)
async function cleanupExpiredBinInsights() {
  try {
    const now = new Date();
    await Content.deleteMany({ deletedAt: { $ne: null }, deletedUntil: { $lte: now } });
  } catch (err) {
    console.error('[Bin Cleanup] Error cleaning up insights:', err.message);
  }
}

async function assertTopicAccess(topicId, user) {
  const topic = await Topic.findById(topicId);
  if (!topic) return { error: { status: 404, message: 'Topic not found' } };

  if (user.role === 'teacher') {
    if (topic.createdBy.toString() !== user._id.toString()) {
      return { error: { status: 403, message: 'Forbidden' } };
    }
  } else if (user.role === 'student') {
    const subject = await Subject.findById(topic.subjectRef);
    if (!subject || subject.deletedAt) {
      return { error: { status: 404, message: 'Subject not found' } };
    }
    if (subject.classRef.toString() !== user.classRef?.toString()) {
      return { error: { status: 403, message: 'Forbidden' } };
    }
  }

  return { topic, subject: await Subject.findById(topic.subjectRef) };
}

/** List all active blogs/posts in a topic */
router.get('/topic/:topicId', async (req, res, next) => {
  try {
    const { topic, subject, error } = await assertTopicAccess(req.params.topicId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const filter = { topicRef: topic._id, deletedAt: null };
    if (req.user.role === 'student') {
      filter.published = true;
      filter.classRef = req.user.classRef;
    }

    const items = await Content.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('title published createdAt updatedAt topicRef subjectRef classRef createdBy order');

    res.json(items);
  } catch (err) {
    next(err);
  }
});

/** GET /api/content/teacher/analytics — Real analytics & active insights for logged-in teacher */
router.get('/teacher/analytics', requireRole('teacher'), async (req, res, next) => {
  try {
    await cleanupExpiredBinInsights();
    const teacherId = req.user._id;

    // Only active (non-soft-deleted) insights
    const contents = await Content.find({ createdBy: teacherId, deletedAt: null })
      .populate('classRef', 'name code')
      .populate('subjectRef', 'name')
      .populate('topicRef', 'name')
      .sort({ createdAt: -1 });

    const totalInsights = contents.length;
    const publishedCount = contents.filter((c) => c.published).length;
    const draftCount = contents.filter((c) => !c.published).length;

    let totalReach = 0;
    let totalAppreciations = 0;
    let totalBookmarks = 0;

    const classReachMap = {};

    for (const item of contents) {
      const views = item.viewsCount || 0;
      const likes = item.likesCount || 0;
      const bookmarks = item.bookmarksCount || 0;

      totalReach += views;
      totalAppreciations += likes;
      totalBookmarks += bookmarks;

      const className = item.classRef?.name || 'General';
      classReachMap[className] = (classReachMap[className] || 0) + views;
    }

    res.json({
      totalInsights,
      publishedCount,
      draftCount,
      totalReach,
      totalAppreciations,
      totalBookmarks,
      classReachMap,
      contents: contents.map((c) => ({
        _id: c._id,
        title: c.title,
        published: c.published,
        viewsCount: c.viewsCount || 0,
        likesCount: c.likesCount || 0,
        bookmarksCount: c.bookmarksCount || 0,
        className: c.classRef?.name || '',
        subjectName: c.subjectRef?.name || '',
        topicName: c.topicRef?.name || '',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/content/teacher/bin — List soft-deleted insights in Teacher Recycle Bin */
router.get('/teacher/bin', requireRole('teacher'), async (req, res, next) => {
  try {
    await cleanupExpiredBinInsights();
    const teacherId = req.user._id;
    const now = new Date();

    const binContents = await Content.find({ createdBy: teacherId, deletedAt: { $ne: null } })
      .populate('classRef', 'name')
      .populate('subjectRef', 'name')
      .populate('topicRef', 'name')
      .sort({ deletedAt: -1 })
      .lean();

    const result = binContents.map((c) => {
      const until = new Date(c.deletedUntil || now);
      const daysLeft = Math.max(0, Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        _id: c._id,
        title: c.title,
        deletedAt: c.deletedAt,
        deletedUntil: c.deletedUntil,
        daysLeft,
        className: c.classRef?.name || '',
        subjectName: c.subjectRef?.name || '',
        topicName: c.topicRef?.name || '',
        createdAt: c.createdAt,
      };
    });

    res.json({ bin: result });
  } catch (err) {
    next(err);
  }
});

/** Get single post with full blocks */
router.get('/:contentId', async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.contentId);
    if (!content || content.deletedAt) return res.status(404).json({ message: 'Content not found' });

    if (req.user.role === 'student') {
      if (!content.published) return res.status(403).json({ message: 'Content not published' });
      if (content.classRef.toString() !== req.user.classRef?.toString()) {
        return res.status(403).json({ message: 'Not authorized for this class' });
      }
      // Increment view counter for student views
      await Content.findByIdAndUpdate(content._id, { $inc: { viewsCount: 1 } });
    } else if (req.user.role === 'teacher') {
      if (content.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    res.json(content);
  } catch (err) {
    next(err);
  }
});

/** Reorder blogs */
router.put('/reorder', requireRole('teacher'), async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: 'orderedIds must be an array' });
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        Content.findOneAndUpdate(
          { _id: id, createdBy: req.user._id, deletedAt: null },
          { $set: { order: index } }
        )
      )
    );

    res.json({ message: 'Order updated successfully' });
  } catch (err) {
    next(err);
  }
});

/** Create new blog in topic */
router.post('/topic/:topicId', requireRole('teacher'), async (req, res, next) => {
  try {
    const { topic, subject, error } = await assertTopicAccess(req.params.topicId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const { title, blocks, published } = req.body;

    const content = await Content.create({
      topicRef: topic._id,
      subjectRef: subject._id,
      classRef: subject.classRef,
      createdBy: req.user._id,
      title: title || 'Untitled',
      blocks: blocks || [],
      published: published ?? false,
    });

    res.status(201).json(content);
  } catch (err) {
    next(err);
  }
});

/** Update existing blog */
router.put('/:contentId', requireRole('teacher'), async (req, res, next) => {
  try {
    const existing = await Content.findById(req.params.contentId);
    if (!existing || existing.deletedAt) return res.status(404).json({ message: 'Content not found' });
    if (existing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { title, blocks, published, topicRef, subjectRef, classRef } = req.body;

    const content = await Content.findByIdAndUpdate(
      req.params.contentId,
      {
        ...(title !== undefined && { title }),
        ...(blocks !== undefined && { blocks }),
        ...(published !== undefined && { published }),
        ...(topicRef !== undefined && { topicRef }),
        ...(subjectRef !== undefined && { subjectRef }),
        ...(classRef !== undefined && { classRef }),
      },
      { new: true, runValidators: true }
    );

    res.json(content);
  } catch (err) {
    next(err);
  }
});

/** Toggle Publish / Unpublish Insight */
router.patch('/:contentId/publish', requireRole('teacher'), async (req, res, next) => {
  try {
    const existing = await Content.findById(req.params.contentId);
    if (!existing || existing.deletedAt) return res.status(404).json({ message: 'Content not found' });
    if (existing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const targetStatus = req.body.published !== undefined ? Boolean(req.body.published) : !existing.published;
    existing.published = targetStatus;
    await existing.save();

    res.json({
      message: `Insight ${existing.published ? 'published' : 'unpublished'} successfully`,
      published: existing.published,
    });
  } catch (err) {
    next(err);
  }
});

/** Soft Delete blog (Move to Teacher Bin) */
router.delete('/:contentId', requireRole('teacher'), async (req, res, next) => {
  try {
    const existing = await Content.findById(req.params.contentId);
    if (!existing) return res.status(404).json({ message: 'Content not found' });
    if (existing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const now = new Date();
    const retention30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    existing.deletedAt = now;
    existing.deletedUntil = retention30Days;
    existing.published = false; // Automatically unpublish when moving to bin
    await existing.save();

    res.json({ message: `Insight "${existing.title}" moved to Recycle Bin (30-day retention).` });
  } catch (err) {
    next(err);
  }
});

/** Restore blog from Recycle Bin (Unbin) */
router.post('/:contentId/restore', requireRole('teacher'), async (req, res, next) => {
  try {
    const existing = await Content.findById(req.params.contentId);
    if (!existing || !existing.deletedAt) return res.status(404).json({ message: 'Insight not found in Recycle Bin' });
    if (existing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    existing.deletedAt = null;
    existing.deletedUntil = null;
    await existing.save();

    res.json({ message: `Insight "${existing.title}" restored successfully from Recycle Bin!` });
  } catch (err) {
    next(err);
  }
});

/** Permanent Delete blog */
router.delete('/:contentId/permanent', requireRole('teacher'), async (req, res, next) => {
  try {
    const existing = await Content.findById(req.params.contentId);
    if (!existing) return res.status(404).json({ message: 'Content not found' });
    if (existing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Content.findByIdAndDelete(req.params.contentId);
    res.json({ message: `Insight "${existing.title}" permanently deleted.` });
  } catch (err) {
    next(err);
  }
});

export default router;
