import { Router } from 'express';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Content from '../models/Content.js';
import User from '../models/User.js';
import SeoSettings from '../models/SeoSettings.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/** GET /api/explore/teachers - all teachers (public) */
router.get('/teachers', async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .sort({ name: 1 })
      .select('name _id avatar bio education experience');
    res.json(teachers);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/teachers/:id - single teacher public profile & published blogs */
router.get('/teachers/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name avatar bio education experience role createdAt'
    );
    if (!user) return res.status(404).json({ message: 'Teacher profile not found' });

    const blogs = await Content.find({ createdBy: user._id, published: true })
      .sort({ createdAt: -1 })
      .select('title blocks createdAt updatedAt topicRef subjectRef classRef createdBy')
      .populate('classRef', 'name')
      .populate('subjectRef', 'name')
      .populate('topicRef', 'name')
      .populate('createdBy', 'name avatar');

    res.json({
      teacher: user,
      blogs,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/classes - all classes (public) */
router.get('/classes', async (req, res, next) => {
  try {
    const classes = await Class.find().sort({ name: 1 }).select('name _id');
    // deduplicate by lowercased name
    const seen = new Set();
    const unique = classes.filter((c) => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    res.json(unique);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/subjects?classId= */
router.get('/subjects', async (req, res, next) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ message: 'classId required' });
    const subjects = await Subject.find({ classRef: classId }).sort({ name: 1 }).select('name _id classRef');
    res.json(subjects);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/topics?subjectId= */
router.get('/topics', async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ message: 'subjectId required' });
    const topics = await Topic.find({ subjectRef: subjectId }).sort({ name: 1 }).select('name _id subjectRef');
    res.json(topics);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/blogs?topicId=&classId=&subjectId=&search=&page=&limit= */
router.get('/blogs', async (req, res, next) => {
  try {
    const { topicId, classId, subjectId, teacherId, search, page = 1, limit = 12 } = req.query;
    const filter = { published: true };

    const parseIds = (val) => {
      if (!val) return null;
      if (Array.isArray(val)) return { $in: val };
      if (typeof val === 'string') {
        const parts = val.split(',').map((s) => s.trim()).filter(Boolean);
        return parts.length > 1 ? { $in: parts } : parts[0];
      }
      return val;
    };

    const parsedTopic = parseIds(topicId);
    const parsedSubject = parseIds(subjectId);
    const parsedClass = parseIds(classId);
    const parsedTeacher = parseIds(teacherId);

    if (parsedTopic) filter.topicRef = parsedTopic;
    if (parsedSubject) filter.subjectRef = parsedSubject;
    if (parsedClass) filter.classRef = parsedClass;
    if (parsedTeacher) filter.createdBy = parsedTeacher;

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Content.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('title blocks createdAt updatedAt topicRef subjectRef classRef createdBy')
        .populate('classRef', 'name')
        .populate('subjectRef', 'name')
        .populate('topicRef', 'name')
        .populate('createdBy', 'name avatar'),
      Content.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      hasMore: skip + items.length < total,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/featured - recently published across all topics */
router.get('/featured', async (req, res, next) => {
  try {
    const items = await Content.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title createdAt topicRef subjectRef classRef createdBy')
      .populate('classRef', 'name')
      .populate('subjectRef', 'name')
      .populate('topicRef', 'name')
      .populate('createdBy', 'name avatar');
    res.json(items);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/blogs/:id - single published blog (no auth) */
router.get('/blogs/:id', async (req, res, next) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, published: true })
      .populate('classRef', 'name')
      .populate('subjectRef', 'name')
      .populate('topicRef', 'name')
      .populate('createdBy', 'name avatar');
    if (!content) return res.status(404).json({ message: 'Blog not found or not published' });
    res.json(content);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/tree - full nested tree (classes → subjects → topics) */
router.get('/tree', async (req, res, next) => {
  try {
    const [classes, subjects, topics] = await Promise.all([
      Class.find().sort({ name: 1 }).select('name _id'),
      Subject.find().sort({ name: 1 }).select('name _id classRef'),
      Topic.find().sort({ name: 1 }).select('name _id subjectRef'),
    ]);

    const topicsBySubject = {};
    for (const t of topics) {
      const sid = t.subjectRef.toString();
      if (!topicsBySubject[sid]) topicsBySubject[sid] = [];
      topicsBySubject[sid].push({ _id: t._id, name: t.name });
    }

    const subjectsByClass = {};
    for (const s of subjects) {
      const cid = s.classRef.toString();
      if (!subjectsByClass[cid]) subjectsByClass[cid] = [];
      subjectsByClass[cid].push({
        _id: s._id,
        name: s.name,
        topics: topicsBySubject[s._id.toString()] || [],
      });
    }

    const tree = classes.map((c) => ({
      _id: c._id,
      name: c.name,
      subjects: subjectsByClass[c._id.toString()] || [],
    }));

    res.json(tree);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/seo - get current SEO settings */
router.get('/seo', async (req, res, next) => {
  try {
    let settings = await SeoSettings.findOne();
    if (!settings) {
      settings = await SeoSettings.create({});
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/explore/seo - update SEO settings (Admin only) */
router.put('/seo', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { title, description, keywords, author, googleSiteVerification, robots } = req.body;
    let settings = await SeoSettings.findOne();
    if (!settings) {
      settings = new SeoSettings();
    }
    if (title !== undefined) settings.title = title;
    if (description !== undefined) settings.description = description;
    if (keywords !== undefined) settings.keywords = keywords;
    if (author !== undefined) settings.author = author;
    if (googleSiteVerification !== undefined) settings.googleSiteVerification = googleSiteVerification;
    if (robots !== undefined) settings.robots = robots;

    await settings.save();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

export default router;
