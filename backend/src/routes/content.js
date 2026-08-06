import { Router } from 'express';
import Content from '../models/Content.js';
import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

async function assertTopicAccess(topicId, user) {
  const topic = await Topic.findById(topicId);
  if (!topic) return { error: { status: 404, message: 'Topic not found' } };

  if (user.role === 'teacher') {
    if (topic.createdBy.toString() !== user._id.toString()) {
      return { error: { status: 403, message: 'Forbidden' } };
    }
  } else if (user.role === 'student') {
    const subject = await Subject.findById(topic.subjectRef);
    if (subject.classRef.toString() !== user.classRef?.toString()) {
      return { error: { status: 403, message: 'Forbidden' } };
    }
  }

  return { topic, subject: await Subject.findById(topic.subjectRef) };
}

/** List all blogs/posts in a topic */
router.get('/topic/:topicId', async (req, res, next) => {
  try {
    const { topic, subject, error } = await assertTopicAccess(req.params.topicId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const filter = { topicRef: topic._id };
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

/** GET /api/content/teacher/analytics — Real analytics from DB for logged-in teacher */
router.get('/teacher/analytics', requireRole('teacher'), async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const contents = await Content.find({ createdBy: teacherId })
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

/** Get single post with full blocks */
router.get('/:contentId', async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: 'Content not found' });

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

    // Process updates in parallel
    await Promise.all(
      orderedIds.map((id, index) =>
        Content.findOneAndUpdate(
          { _id: id, createdBy: req.user._id }, // Ensure user owns the content
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
    if (!existing) return res.status(404).json({ message: 'Content not found' });
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

/** Delete blog */
router.delete('/:contentId', requireRole('teacher'), async (req, res, next) => {
  try {
    const existing = await Content.findById(req.params.contentId);
    if (!existing) return res.status(404).json({ message: 'Content not found' });
    if (existing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Content.findByIdAndDelete(req.params.contentId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
