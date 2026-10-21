import { Router } from 'express';
import mongoose from 'mongoose';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Content from '../models/Content.js';
import User from '../models/User.js';
import SeoSettings from '../models/SeoSettings.js';
import Testimonial from '../models/Testimonial.js';
import HomeSettings, { DEFAULT_BANNERS } from '../models/HomeSettings.js';
import TopTeacherCard from '../models/TopTeacherCard.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildSearchRegex, expandSearchVariants } from '../utils/hindiTransliterate.js';

const router = Router();

/** GET /api/explore/teachers - all teachers (public) */
router.get('/teachers', async (req, res, next) => {
  try {
    // Find all users with role 'teacher' or 'admin', or who have published content
    const publishedCreatorIds = await Content.find({ published: true }).distinct('createdBy');

    const teachers = await User.find({
      $or: [
        { role: 'teacher' },
        { role: 'admin' },
        { _id: { $in: publishedCreatorIds } },
      ],
    })
      .sort({ name: 1 })
      .select('name _id avatar bio education experience createdAt role');

    // Aggregate published blogs count & unique subjects per teacher
    const contents = await Content.find({ published: true })
      .populate('subjectRef', 'name')
      .select('createdBy subjectRef');

    const countMap = new Map();
    const subjectsMap = new Map();

    for (const c of contents) {
      if (!c.createdBy) continue;
      const tid = c.createdBy.toString();
      countMap.set(tid, (countMap.get(tid) || 0) + 1);

      let subName = '';
      if (c.subjectRef && typeof c.subjectRef === 'object' && c.subjectRef.name) {
        subName = c.subjectRef.name.trim();
      } else if (typeof c.subjectRef === 'string') {
        subName = c.subjectRef.trim();
      }

      if (subName) {
        if (!subjectsMap.has(tid)) subjectsMap.set(tid, new Set());
        subjectsMap.get(tid).add(subName);
      }
    }

    const result = teachers.map((t) => {
      const obj = t.toObject();
      const tid = t._id.toString();
      obj.blogsCount = countMap.get(tid) || 0;
      obj.subjects = Array.from(subjectsMap.get(tid) || []);
      return obj;
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/teachers/:id - single teacher public profile & paginated published blogs */
router.get('/teachers/:id', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    const user = await User.findById(req.params.id).select(
      'name avatar bio education experience role createdAt'
    );
    if (!user) return res.status(404).json({ message: 'Teacher profile not found' });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { createdBy: user._id, published: true };

    const [blogs, total] = await Promise.all([
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
      teacher: user,
      blogs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: skip + blogs.length < total,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/classes - all classes (public) */
router.get('/classes', async (req, res, next) => {
  try {
    const classes = await Class.find({ deletedAt: null }).sort({ name: 1 }).select('name _id');
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

/** GET /api/explore/subjects?classId= (returns all unique subjects from DB) */
router.get('/subjects', async (req, res, next) => {
  try {
    const { classId } = req.query;
    const filter = classId ? { classRef: classId, deletedAt: null } : { deletedAt: null };
    const subjects = await Subject.find(filter).sort({ name: 1 }).select('name _id classRef');
    
    let subjectNames = subjects.map((s) => (s.name || '').trim()).filter(Boolean);

    // Also collect subjects from published contents if Subject model has no entries
    if (subjectNames.length === 0) {
      const contents = await Content.find({ published: true })
        .populate('subjectRef', 'name')
        .select('subjectRef');
      for (const c of contents) {
        if (c.subjectRef && typeof c.subjectRef === 'object' && c.subjectRef.name) {
          subjectNames.push(c.subjectRef.name.trim());
        }
      }
    }

    // Default subject list if DB has no subject entries yet
    if (subjectNames.length === 0) {
      subjectNames = [
        'Physics',
        'Mathematics',
        'Literature',
        'Science',
        'Chemistry',
        'Biology',
        'English',
        'History',
      ];
    }

    // Deduplicate by lowercased name while preserving original casing
    const seen = new Set();
    const uniqueSubjects = [];
    for (const name of subjectNames) {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSubjects.push({ _id: key, name });
      }
    }

    res.json(uniqueSubjects);
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
      filter.title = buildSearchRegex(search);
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

/**
 * GET /api/explore/search?q=
 * Unified multi-entity search and recommendations endpoint:
 * - Empty query: returns popular tags, recommended teachers, trending blogs, popular topics
 * - With query: matches teachers, blogs (by title AND by related topic/subject), and topics/subjects
 */
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      // 1. Recommendations State
      const [teachers, blogs, topics] = await Promise.all([
        // Top 4 recommended teachers
        User.find({
          $or: [
            { role: 'teacher' },
            { role: 'admin' },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(4)
          .select('name _id avatar bio education experience role'),

        // Top 5 trending / featured blogs
        Content.find({ published: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title blocks createdAt topicRef subjectRef classRef createdBy')
          .populate('classRef', 'name')
          .populate('subjectRef', 'name')
          .populate('topicRef', 'name')
          .populate('createdBy', 'name avatar'),

        // Popular topics
        Topic.find().limit(6).select('name _id subjectRef').populate('subjectRef', 'name'),
      ]);

      const teacherIds = teachers.map((t) => t._id);
      const contentsForCounts = await Content.find({
        published: true,
        createdBy: { $in: teacherIds },
      })
        .populate('subjectRef', 'name')
        .select('createdBy subjectRef');

      const countMap = new Map();
      const subMap = new Map();
      for (const c of contentsForCounts) {
        if (!c.createdBy) continue;
        const tid = c.createdBy.toString();
        countMap.set(tid, (countMap.get(tid) || 0) + 1);
        const sName = c.subjectRef?.name || (typeof c.subjectRef === 'string' ? c.subjectRef : '');
        if (sName) {
          if (!subMap.has(tid)) subMap.set(tid, new Set());
          subMap.get(tid).add(sName);
        }
      }

      const formattedTeachers = teachers.map((t) => ({
        _id: t._id,
        name: t.name,
        avatar: t.avatar,
        bio: t.bio,
        role: t.role,
        blogsCount: countMap.get(t._id.toString()) || 0,
        subjects: Array.from(subMap.get(t._id.toString()) || []),
      }));

      return res.json({
        isRecommendation: true,
        popularSearches: [
          'कक्षा 10 विज्ञान',
          'हिंदी पद्य',
          'Class 12 Physics',
          'Mathematics',
          'व्याकरण (Grammar)',
          'Newton Laws',
          'संस्कृत श्लोक',
          'Board Exam Preparation',
        ],
        teachers: formattedTeachers,
        blogs,
        topics: topics.map((top) => ({
          _id: top._id,
          name: top.name,
          subjectName: top.subjectRef?.name || '',
        })),
      });
    }

    // 2. Query Search State (with phonetic & transliteration expansion)
    const searchRegex = buildSearchRegex(q);

    const [matchingTopics, matchingSubjects] = await Promise.all([
      Topic.find({ name: searchRegex }).select('_id name subjectRef').populate('subjectRef', 'name'),
      Subject.find({ name: searchRegex }).select('_id name'),
    ]);

    const matchingTopicIds = matchingTopics.map((t) => t._id);
    const matchingSubjectIds = matchingSubjects.map((s) => s._id);

    const [matchedTeachers, matchedBlogs] = await Promise.all([
      User.find({
        $and: [
          {
            $or: [
              { role: 'teacher' },
              { role: 'admin' },
            ],
          },
          {
            $or: [
              { name: searchRegex },
              { bio: searchRegex },
            ],
          },
        ],
      })
        .limit(6)
        .select('name _id avatar bio education experience role'),

      Content.find({
        published: true,
        $or: [
          { title: searchRegex },
          ...(matchingTopicIds.length > 0 ? [{ topicRef: { $in: matchingTopicIds } }] : []),
          ...(matchingSubjectIds.length > 0 ? [{ subjectRef: { $in: matchingSubjectIds } }] : []),
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title blocks createdAt topicRef subjectRef classRef createdBy')
        .populate('classRef', 'name')
        .populate('subjectRef', 'name')
        .populate('topicRef', 'name')
        .populate('createdBy', 'name avatar'),
    ]);

    const teacherIds = matchedTeachers.map((t) => t._id);
    const contentsForCounts = await Content.find({
      published: true,
      createdBy: { $in: teacherIds },
    })
      .populate('subjectRef', 'name')
      .select('createdBy subjectRef');

    const countMap = new Map();
    const subMap = new Map();
    for (const c of contentsForCounts) {
      if (!c.createdBy) continue;
      const tid = c.createdBy.toString();
      countMap.set(tid, (countMap.get(tid) || 0) + 1);
      const sName = c.subjectRef?.name || (typeof c.subjectRef === 'string' ? c.subjectRef : '');
      if (sName) {
        if (!subMap.has(tid)) subMap.set(tid, new Set());
        subMap.get(tid).add(sName);
      }
    }

    const formattedTeachers = matchedTeachers.map((t) => ({
      _id: t._id,
      name: t.name,
      avatar: t.avatar,
      bio: t.bio,
      role: t.role,
      blogsCount: countMap.get(t._id.toString()) || 0,
      subjects: Array.from(subMap.get(t._id.toString()) || []),
    }));

    const formattedTopics = [
      ...matchingTopics.map((top) => ({
        _id: top._id,
        name: top.name,
        type: 'topic',
        subjectName: top.subjectRef?.name || '',
      })),
      ...matchingSubjects.map((sub) => ({
        _id: sub._id,
        name: sub.name,
        type: 'subject',
        subjectName: sub.name,
      })),
    ].slice(0, 6);

    res.json({
      query: q,
      isRecommendation: false,
      teachers: formattedTeachers,
      blogs: matchedBlogs,
      topics: formattedTopics,
      totalCount: formattedTeachers.length + matchedBlogs.length + formattedTopics.length,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/featured - recently published across all topics (with optional subject & limit) */
router.get('/featured', async (req, res, next) => {
  try {
    const { limit = 60, subject } = req.query;
    const query = { published: true };

    if (subject) {
      const matchingSubs = await Subject.find({
        name: { $regex: new RegExp(escapeRegex(subject), 'i') },
      }).distinct('_id');
      if (matchingSubs.length > 0) {
        query.subjectRef = { $in: matchingSubs };
      }
    }

    // Check if admin pinned specific content IDs in HomeSettings
    const settings = await HomeSettings.findOne();
    let pinnedItems = [];
    if (settings?.featuredInsightIds?.length > 0 && !subject) {
      pinnedItems = await Content.find({ _id: { $in: settings.featuredInsightIds }, published: true })
        .select('title createdAt topicRef subjectRef classRef createdBy blocks')
        .populate('classRef', 'name')
        .populate('subjectRef', 'name')
        .populate('topicRef', 'name')
        .populate('createdBy', 'name avatar');
    }

    const pinnedIds = pinnedItems.map((p) => p._id.toString());
    const remainingLimit = Math.max(1, parseInt(limit) - pinnedItems.length);

    const normalItems = await Content.find({
      ...query,
      _id: { $nin: pinnedIds },
    })
      .sort({ createdAt: -1 })
      .limit(remainingLimit)
      .select('title createdAt topicRef subjectRef classRef createdBy blocks')
      .populate('classRef', 'name')
      .populate('subjectRef', 'name')
      .populate('topicRef', 'name')
      .populate('createdBy', 'name avatar');

    res.json([...pinnedItems, ...normalItems]);
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
      Class.find({ deletedAt: null }).sort({ name: 1 }).select('name _id'),
      Subject.find({ deletedAt: null }).sort({ name: 1 }).select('name _id classRef'),
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

/** GET /api/explore/stats - home page marketing stats (admin-set) */
router.get('/stats', async (req, res, next) => {
  try {
    let settings = await HomeSettings.findOne();
    if (!settings) {
      settings = await HomeSettings.create({});
    }
    res.json(settings.stats);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/banners - home page active banners (admin-managed) */
router.get('/banners', async (req, res, next) => {
  try {
    let settings = await HomeSettings.findOne();
    if (!settings) {
      settings = await HomeSettings.create({ banners: DEFAULT_BANNERS });
    } else if (!settings.banners || settings.banners.length === 0) {
      settings.banners = DEFAULT_BANNERS;
      await settings.save();
    }
    const banners = (settings.banners || [])
      .filter((b) => b.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(banners);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/testimonials - active testimonials (public) */
router.get('/testimonials', async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select('name role avatar review rating');
    res.json(testimonials);
  } catch (err) {
    next(err);
  }
});

/** GET /api/explore/top-teachers - top teachers from TopTeacherCard collection or fallback */
router.get('/top-teachers', async (req, res, next) => {
  try {
    const customCards = await TopTeacherCard.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
    if (customCards && customCards.length > 0) {
      return res.json(customCards);
    }

    const publishedCreatorIds = await Content.find({ published: true }).distinct('createdBy');
    const teachers = await User.find({
      $or: [
        { role: { $in: ['teacher', 'admin'] } },
        { _id: { $in: publishedCreatorIds } },
      ],
    })
      .select('name _id avatar bio education experience role')
      .lean();

    const contents = await Content.find({ published: true })
      .populate('subjectRef', 'name')
      .select('createdBy subjectRef')
      .lean();

    const countMap = new Map();
    const subjectsMap = new Map();
    for (const c of contents) {
      if (!c.createdBy) continue;
      const tid = c.createdBy.toString();
      countMap.set(tid, (countMap.get(tid) || 0) + 1);
      const subName = c.subjectRef?.name?.trim() || '';
      if (subName) {
        if (!subjectsMap.has(tid)) subjectsMap.set(tid, new Set());
        subjectsMap.get(tid).add(subName);
      }
    }

    const result = teachers
      .map((t) => ({
        ...t,
        blogsCount: countMap.get(t._id.toString()) || 0,
        subjects: Array.from(subjectsMap.get(t._id.toString()) || []),
      }))
      .sort((a, b) => b.blogsCount - a.blogsCount)
      .slice(0, 10);

    res.json(result);
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
