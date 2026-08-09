import { Router } from 'express';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';
import TaxonomyAuditLog from '../models/TaxonomyAuditLog.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Auto cleanup subjects/classes in recycle bin older than 30 days
export async function cleanupExpiredBinItems() {
  try {
    const now = new Date();
    const expiredSubjects = await Subject.find({ deletedAt: { $ne: null }, deletedUntil: { $lte: now } });
    for (const sub of expiredSubjects) {
      await Topic.deleteMany({ subjectRef: sub._id });
      await Subject.findByIdAndDelete(sub._id);
      console.log(`[Bin Cleanup] Auto permanently deleted subject "${sub.name}" after 30-day retention.`);
    }

    const expiredClasses = await Class.find({ deletedAt: { $ne: null }, deletedUntil: { $lte: now } });
    for (const cls of expiredClasses) {
      const subs = await Subject.find({ classRef: cls._id });
      for (const s of subs) {
        await Topic.deleteMany({ subjectRef: s._id });
      }
      await Subject.deleteMany({ classRef: cls._id });
      await Class.findByIdAndDelete(cls._id);
      console.log(`[Bin Cleanup] Auto permanently deleted class "${cls.name}" after 30-day retention.`);
    }
  } catch (err) {
    console.error('[Bin Cleanup] Error during auto cleanup:', err.message);
  }
}

export async function seedDefaultTaxonomy() {
  try {
    await cleanupExpiredBinItems();
    const superAdmin = await User.findOne({ role: 'super_admin' });
    const defaultClasses = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'General'];
    for (const name of defaultClasses) {
      const existing = await Class.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, deletedAt: null });
      if (!existing) {
        await Class.create({ name, ...(superAdmin && { createdBy: superAdmin._id }) });
      }
    }
  } catch (err) {
    console.error('[Taxonomy] Failed to seed default classes:', err.message);
  }
}

router.get('/classes/public', async (req, res, next) => {
  try {
    const classes = await Class.find({ deletedAt: null }).sort({ name: 1 }).select('name _id');
    const unique = [...new Map(classes.map((c) => [c.name.toLowerCase(), c])).values()];
    res.json(unique);
  } catch (err) {
    next(err);
  }
});

router.use(authenticate);

router.get('/classes', async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const cls = await Class.findOne({ _id: req.user.classRef, deletedAt: null });
      return res.json(cls ? [cls] : []);
    }
    // Return all active classes
    const classes = await Class.find({ deletedAt: null }).sort({ name: 1 });
    const unique = [...new Map(classes.map((c) => [c.name.toLowerCase().trim(), c])).values()];
    res.json(unique);
  } catch (err) {
    next(err);
  }
});

router.post('/classes', requireRole('teacher'), async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Name required' });
    const existing = await Class.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      deletedAt: null,
    });
    if (existing) return res.json(existing);
    const cls = await Class.create({ name, createdBy: req.user._id });
    res.status(201).json(cls);
  } catch (err) {
    next(err);
  }
});

router.get('/subjects', async (req, res, next) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ message: 'classId required' });
    const filter = { classRef: classId, deletedAt: null };
    const subjects = await Subject.find(filter).sort({ name: 1 });
    const unique = [...new Map(subjects.map((s) => [s.name.toLowerCase().trim(), s])).values()];
    res.json(unique);
  } catch (err) {
    next(err);
  }
});

router.post('/subjects', requireRole('teacher'), async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const { classId } = req.body;
    if (!name || !classId) return res.status(400).json({ message: 'Name and classId required' });
    const existing = await Subject.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      classRef: classId,
      deletedAt: null,
    });
    if (existing) return res.json(existing);
    const subject = await Subject.create({
      name,
      classRef: classId,
      createdBy: req.user._id,
    });
    res.status(201).json(subject);
  } catch (err) {
    next(err);
  }
});

router.get('/topics', async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ message: 'subjectId required' });
    const filter = { subjectRef: subjectId };
    if (req.user.role === 'teacher') {
      filter.createdBy = req.user._id;
    }
    const topics = await Topic.find(filter).sort({ name: 1 });
    const unique = [...new Map(topics.map((t) => [t.name.toLowerCase().trim(), t])).values()];
    res.json(unique);
  } catch (err) {
    next(err);
  }
});

router.post('/topics', requireRole('teacher'), async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const { subjectId } = req.body;
    if (!name || !subjectId) return res.status(400).json({ message: 'Name and subjectId required' });
    const existing = await Topic.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      subjectRef: subjectId,
      createdBy: req.user._id,
    });
    if (existing) return res.json(existing);
    const topic = await Topic.create({
      name,
      subjectRef: subjectId,
      createdBy: req.user._id,
    });
    res.status(201).json(topic);
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN TAXONOMY & SUBJECT MANAGEMENT ENDPOINTS ────────────────────────────

// Get full taxonomy overview (Classes, Subjects, Audit Logs)
router.get('/admin/overview', requireRole('admin'), async (req, res, next) => {
  try {
    await cleanupExpiredBinItems();
    const classes = await Class.find({ deletedAt: null }).sort({ name: 1 }).populate('createdBy', 'name email');
    const subjects = await Subject.find({ deletedAt: null }).sort({ name: 1 }).populate('classRef', 'name').populate('createdBy', 'name email');
    const auditLogs = await TaxonomyAuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('performedBy', 'name email role');

    res.json({ classes, subjects, auditLogs });
  } catch (err) {
    next(err);
  }
});

// Admin Add Class
router.post('/admin/classes', requireRole('admin'), async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Class name required' });

    const existing = await Class.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, deletedAt: null });
    if (existing) return res.status(400).json({ message: `Class "${name}" already exists` });

    const cls = await Class.create({ name, createdBy: req.user._id, isActive: true });

    await TaxonomyAuditLog.create({
      targetType: 'class',
      targetId: cls._id,
      targetName: cls.name,
      action: 'create',
      newName: cls.name,
      performedBy: req.user._id,
      details: `Created new Class "${cls.name}"`,
    });

    res.status(201).json({ message: 'Class created successfully', classItem: cls });
  } catch (err) {
    next(err);
  }
});

// Admin Update / Activate / Deactivate Class
router.put('/admin/classes/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const cls = await Class.findOne({ _id: id, deletedAt: null });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const previousName = cls.name;
    const previousActive = cls.isActive !== false;

    if (req.body.name !== undefined && req.body.name.trim()) {
      cls.name = req.body.name.trim();
    }
    if (req.body.isActive !== undefined) {
      cls.isActive = Boolean(req.body.isActive);
    }

    await cls.save();

    if (previousName !== cls.name) {
      await TaxonomyAuditLog.create({
        targetType: 'class',
        targetId: cls._id,
        targetName: cls.name,
        action: 'edit',
        previousName,
        newName: cls.name,
        performedBy: req.user._id,
        details: `Renamed Class from "${previousName}" to "${cls.name}"`,
      });
    }

    if (previousActive !== cls.isActive) {
      await TaxonomyAuditLog.create({
        targetType: 'class',
        targetId: cls._id,
        targetName: cls.name,
        action: cls.isActive ? 'activate' : 'deactivate',
        performedBy: req.user._id,
        details: `${cls.isActive ? 'Activated' : 'Deactivated'} Class "${cls.name}"`,
      });
    }

    res.json({ message: 'Class updated successfully', classItem: cls });
  } catch (err) {
    next(err);
  }
});

// Admin Add Subject
router.post('/admin/subjects', requireRole('admin'), async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const { classId } = req.body;
    if (!name || !classId) return res.status(400).json({ message: 'Subject name and Class ID required' });

    const cls = await Class.findOne({ _id: classId, deletedAt: null });
    if (!cls) return res.status(400).json({ message: 'Invalid Class specified' });

    const existing = await Subject.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      classRef: classId,
      deletedAt: null,
    });
    if (existing) return res.status(400).json({ message: `Subject "${name}" already exists under ${cls.name}` });

    const subject = await Subject.create({
      name,
      classRef: classId,
      createdBy: req.user._id,
      isActive: true,
    });

    await TaxonomyAuditLog.create({
      targetType: 'subject',
      targetId: subject._id,
      targetName: subject.name,
      action: 'create',
      newName: subject.name,
      performedBy: req.user._id,
      details: `Created new Subject "${subject.name}" under ${cls.name}`,
    });

    res.status(201).json({ message: 'Subject created successfully', subjectItem: subject });
  } catch (err) {
    next(err);
  }
});

// Admin Update / Activate / Deactivate Subject
router.put('/admin/subjects/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findOne({ _id: id, deletedAt: null }).populate('classRef', 'name');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const previousName = subject.name;
    const previousActive = subject.isActive !== false;

    if (req.body.name !== undefined && req.body.name.trim()) {
      subject.name = req.body.name.trim();
    }
    if (req.body.classId !== undefined) {
      subject.classRef = req.body.classId;
    }
    if (req.body.isActive !== undefined) {
      subject.isActive = Boolean(req.body.isActive);
    }

    await subject.save();

    if (previousName !== subject.name) {
      await TaxonomyAuditLog.create({
        targetType: 'subject',
        targetId: subject._id,
        targetName: subject.name,
        action: 'edit',
        previousName,
        newName: subject.name,
        performedBy: req.user._id,
        details: `Renamed Subject from "${previousName}" to "${subject.name}"`,
      });
    }

    if (previousActive !== subject.isActive) {
      await TaxonomyAuditLog.create({
        targetType: 'subject',
        targetId: subject._id,
        targetName: subject.name,
        action: subject.isActive ? 'activate' : 'deactivate',
        performedBy: req.user._id,
        details: `${subject.isActive ? 'Activated' : 'Deactivated'} Subject "${subject.name}"`,
      });
    }

    res.json({ message: 'Subject updated successfully', subjectItem: subject });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN: SUBJECTS WITH BLOG COUNTS (class-wise) ─────────────────────────

/** GET /api/taxonomy/admin/subjects-with-counts — All classes with their active subjects + blog/topic counts */
router.get('/admin/subjects-with-counts', requireRole('admin'), async (req, res, next) => {
  try {
    await cleanupExpiredBinItems();
    const classes = await Class.find({ deletedAt: null }).sort({ name: 1 }).lean();
    const allSubjects = await Subject.find({ deletedAt: null }).sort({ name: 1 }).lean();

    const Content = (await import('../models/Content.js')).default;

    const blogCounts = await Content.aggregate([
      { $group: { _id: '$subjectRef', count: { $sum: 1 } } },
    ]);
    const blogCountMap = {};
    blogCounts.forEach((b) => { blogCountMap[b._id.toString()] = b.count; });

    const topicCounts = await Topic.aggregate([
      { $group: { _id: '$subjectRef', count: { $sum: 1 } } },
    ]);
    const topicCountMap = {};
    topicCounts.forEach((t) => { topicCountMap[t._id.toString()] = t.count; });

    const result = classes.map((cls) => {
      const classSubjects = allSubjects
        .filter((s) => s.classRef.toString() === cls._id.toString())
        .map((s) => ({
          _id: s._id,
          name: s.name,
          isActive: s.isActive,
          createdAt: s.createdAt,
          createdBy: s.createdBy,
          blogCount: blogCountMap[s._id.toString()] || 0,
          topicCount: topicCountMap[s._id.toString()] || 0,
        }));

      return {
        _id: cls._id,
        name: cls.name,
        isActive: cls.isActive,
        subjects: classSubjects,
        totalBlogs: classSubjects.reduce((sum, s) => sum + s.blogCount, 0),
      };
    });

    res.json({ classes: result });
  } catch (err) {
    next(err);
  }
});

// ─── RECYCLE BIN / SOFT DELETE ENDPOINTS ────────────────────────────────────

/** GET /api/taxonomy/admin/bin — List soft-deleted subjects & classes in Recycle Bin */
/** GET /api/taxonomy/admin/bin — List soft-deleted subjects & classes in Recycle Bin */
router.get('/admin/bin', requireRole('admin'), async (req, res, next) => {
  try {
    await cleanupExpiredBinItems();
    const now = new Date();
    const Content = (await import('../models/Content.js')).default;

    // Fetch Deleted Classes
    const deletedClasses = await Class.find({ deletedAt: { $ne: null } })
      .populate('deletedBy', 'name email')
      .sort({ deletedAt: -1 })
      .lean();

    const classesInBin = await Promise.all(
      deletedClasses.map(async (c) => {
        const subjectCount = await Subject.countDocuments({ classRef: c._id });
        const subjects = await Subject.find({ classRef: c._id }).select('_id');
        const subIds = subjects.map((s) => s._id);
        const blogCount = await Content.countDocuments({ subjectRef: { $in: subIds } });
        const until = new Date(c.deletedUntil || c.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        const daysLeft = Math.max(0, Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          ...c,
          type: 'class',
          subjectCount,
          blogCount,
          daysLeft,
        };
      })
    );

    // Fetch Deleted Subjects
    const deletedSubjects = await Subject.find({ deletedAt: { $ne: null } })
      .populate('classRef', 'name deletedAt')
      .populate('deletedBy', 'name email')
      .sort({ deletedAt: -1 })
      .lean();

    const subjectsInBin = await Promise.all(
      deletedSubjects.map(async (s) => {
        const blogCount = await Content.countDocuments({ subjectRef: s._id });
        const topicCount = await Topic.countDocuments({ subjectRef: s._id });
        const until = new Date(s.deletedUntil || s.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        const daysLeft = Math.max(0, Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          ...s,
          type: 'subject',
          blogCount,
          topicCount,
          daysLeft,
        };
      })
    );

    res.json({ classes: classesInBin, subjects: subjectsInBin });
  } catch (err) {
    next(err);
  }
});

/** POST /api/taxonomy/admin/classes/:id/restore — Restore Class from Recycle Bin (Unbin) — Admin & Super Admin */
router.post('/admin/classes/:id/restore', requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ message: 'Class not found in Recycle Bin' });

    cls.deletedAt = null;
    cls.deletedUntil = null;
    cls.deletedBy = null;
    cls.isActive = true;
    await cls.save();

    // Also restore any subjects belonging to this class that were in the bin
    await Subject.updateMany(
      { classRef: id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null, deletedUntil: null, deletedBy: null, isActive: true } }
    );

    await TaxonomyAuditLog.create({
      targetType: 'class',
      targetId: cls._id,
      targetName: cls.name,
      action: 'restore',
      performedBy: req.user._id,
      details: `Restored Class "${cls.name}" and its subjects from Recycle Bin back to active classes`,
    });

    res.json({ message: `Class "${cls.name}" restored successfully from Recycle Bin!` });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/taxonomy/admin/classes/:id/permanent — Permanently Delete Class (Super Admin only) */
router.delete('/admin/classes/:id/permanent', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const subjects = await Subject.find({ classRef: id });
    for (const sub of subjects) {
      await Topic.deleteMany({ subjectRef: sub._id });
    }
    await Subject.deleteMany({ classRef: id });
    await Class.findByIdAndDelete(id);

    await TaxonomyAuditLog.create({
      targetType: 'class',
      targetId: cls._id,
      targetName: cls.name,
      action: 'permanent_delete',
      performedBy: req.user._id,
      details: `Permanently deleted Class "${cls.name}" and all its subjects & topics`,
    });

    res.json({ message: `Class "${cls.name}" permanently deleted.` });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/taxonomy/admin/subjects/:id — Move Subject to Recycle Bin (Super Admin only) */
router.delete('/admin/subjects/:id', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id).populate('classRef', 'name');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    if (subject.deletedAt) {
      return res.status(400).json({ message: 'Subject is already in the Recycle Bin' });
    }

    const Content = (await import('../models/Content.js')).default;
    const blogCount = await Content.countDocuments({ subjectRef: id });

    const now = new Date();
    const retention30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    subject.deletedAt = now;
    subject.deletedUntil = retention30Days;
    subject.deletedBy = req.user._id;
    subject.isActive = false;
    await subject.save();

    await TaxonomyAuditLog.create({
      targetType: 'subject',
      targetId: subject._id,
      targetName: subject.name,
      action: 'soft_delete',
      performedBy: req.user._id,
      details: `Moved Subject "${subject.name}" (${blogCount} blogs) to Recycle Bin (30 days retention until ${retention30Days.toLocaleDateString()})`,
    });

    res.json({
      message: `Subject "${subject.name}" moved to Recycle Bin. It will be retained for 30 days before permanent deletion.`,
      retentionUntil: retention30Days,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/taxonomy/admin/subjects/:id/restore — Restore Subject from Recycle Bin (Unbin) — Admin & Super Admin */
router.post('/admin/subjects/:id/restore', requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id).populate('classRef');
    if (!subject) return res.status(404).json({ message: 'Subject not found in Recycle Bin' });

    subject.deletedAt = null;
    subject.deletedUntil = null;
    subject.deletedBy = null;
    subject.isActive = true;
    await subject.save();

    // If parent class was also soft-deleted in the bin, auto-restore parent class too!
    let parentRestored = false;
    if (subject.classRef && subject.classRef.deletedAt) {
      await Class.findByIdAndUpdate(subject.classRef._id, {
        $set: { deletedAt: null, deletedUntil: null, deletedBy: null, isActive: true },
      });
      parentRestored = true;
    }

    await TaxonomyAuditLog.create({
      targetType: 'subject',
      targetId: subject._id,
      targetName: subject.name,
      action: 'restore',
      performedBy: req.user._id,
      details: `Restored Subject "${subject.name}" from Recycle Bin back to active subjects in ${subject.classRef?.name || 'Class'}${parentRestored ? ' (Parent Class also auto-restored)' : ''}`,
    });

    res.json({
      message: `Subject "${subject.name}" restored successfully!${parentRestored ? ` (Class "${subject.classRef?.name}" also restored)` : ''}`,
    });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/taxonomy/admin/subjects/:id/permanent — Permanently Delete Subject (Super Admin only) */
router.delete('/admin/subjects/:id/permanent', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id).populate('classRef', 'name');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const topicDeleteResult = await Topic.deleteMany({ subjectRef: id });
    await Subject.findByIdAndDelete(id);

    await TaxonomyAuditLog.create({
      targetType: 'subject',
      targetId: subject._id,
      targetName: subject.name,
      action: 'permanent_delete',
      performedBy: req.user._id,
      details: `Permanently deleted Subject "${subject.name}" (${topicDeleteResult.deletedCount} orphan topics removed)`,
    });

    res.json({ message: `Subject "${subject.name}" permanently deleted.` });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN: DELETE CLASS (Soft Delete — Super Admin only) ──────────────────────

router.delete('/admin/classes/:id', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const now = new Date();
    const retention30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    cls.deletedAt = now;
    cls.deletedUntil = retention30Days;
    cls.deletedBy = req.user._id;
    cls.isActive = false;
    await cls.save();

    await Subject.updateMany(
      { classRef: id, deletedAt: null },
      { $set: { deletedAt: now, deletedUntil: retention30Days, deletedBy: req.user._id, isActive: false } }
    );

    await TaxonomyAuditLog.create({
      targetType: 'class',
      targetId: cls._id,
      targetName: cls.name,
      action: 'soft_delete',
      performedBy: req.user._id,
      details: `Moved Class "${cls.name}" and its subjects to Recycle Bin (30-day retention)`,
    });

    res.json({ message: `Class "${cls.name}" moved to Recycle Bin (30-day retention).` });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN: MERGE SUBJECTS (within same class) ─────────────────────────────

router.post('/admin/subjects/merge', requireRole('admin'), async (req, res, next) => {
  try {
    const { sourceId, targetId } = req.body;
    if (!sourceId || !targetId) return res.status(400).json({ message: 'sourceId and targetId are required' });
    if (sourceId === targetId) return res.status(400).json({ message: 'Cannot merge a subject into itself' });

    const source = await Subject.findById(sourceId).populate('classRef', 'name');
    const target = await Subject.findById(targetId).populate('classRef', 'name');
    if (!source) return res.status(404).json({ message: 'Source subject not found' });
    if (!target) return res.status(404).json({ message: 'Target subject not found' });

    if (source.classRef._id.toString() !== target.classRef._id.toString()) {
      return res.status(400).json({ message: 'Both subjects must belong to the same class to merge' });
    }

    const Content = (await import('../models/Content.js')).default;

    // 1. Reassign Content (blogs) from source to target
    const contentResult = await Content.updateMany(
      { subjectRef: sourceId },
      { $set: { subjectRef: targetId } }
    );

    // 2. Handle Topics: merge or move
    const sourceTopics = await Topic.find({ subjectRef: sourceId });
    const targetTopics = await Topic.find({ subjectRef: targetId });
    const targetTopicNames = new Map(targetTopics.map((t) => [t.name.toLowerCase().trim(), t]));

    let topicsMoved = 0;
    let topicsMerged = 0;
    for (const srcTopic of sourceTopics) {
      const existingTarget = targetTopicNames.get(srcTopic.name.toLowerCase().trim());
      if (existingTarget) {
        await Content.updateMany(
          { topicRef: srcTopic._id },
          { $set: { topicRef: existingTarget._id } }
        );
        await Topic.findByIdAndDelete(srcTopic._id);
        topicsMerged++;
      } else {
        srcTopic.subjectRef = targetId;
        await srcTopic.save();
        topicsMoved++;
      }
    }

    // 3. Hard delete source subject after merge
    await Subject.findByIdAndDelete(sourceId);

    await TaxonomyAuditLog.create({
      targetType: 'subject',
      targetId: target._id,
      targetName: target.name,
      action: 'merge',
      previousName: source.name,
      newName: target.name,
      performedBy: req.user._id,
      details: `Merged "${source.name}" → "${target.name}" in ${source.classRef.name} (${contentResult.modifiedCount} blogs, ${topicsMoved} topics moved, ${topicsMerged} topics merged)`,
    });

    res.json({
      message: `Successfully merged "${source.name}" into "${target.name}"`,
      stats: {
        blogsReassigned: contentResult.modifiedCount,
        topicsMoved,
        topicsMerged,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN: BULK DELETE ALL EMPTY SUBJECTS (Super Admin only) ─────────────

router.post('/admin/subjects/clean-empty', requireRole('super_admin'), async (req, res, next) => {
  try {
    const Content = (await import('../models/Content.js')).default;
    const allSubjects = await Subject.find({ deletedAt: null }).populate('classRef', 'name').lean();

    const emptySubjects = [];
    for (const sub of allSubjects) {
      const count = await Content.countDocuments({ subjectRef: sub._id });
      if (count === 0) emptySubjects.push(sub);
    }

    if (emptySubjects.length === 0) {
      return res.json({ message: 'No empty subjects found. Everything is clean!', deletedCount: 0 });
    }

    const now = new Date();
    const retention30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const emptyIds = emptySubjects.map((s) => s._id);

    await Subject.updateMany(
      { _id: { $in: emptyIds } },
      { $set: { deletedAt: now, deletedUntil: retention30Days, deletedBy: req.user._id, isActive: false } }
    );

    const names = emptySubjects.map((s) => `"${s.name}" (${s.classRef?.name || '?'})`).join(', ');
    await TaxonomyAuditLog.create({
      targetType: 'subject',
      targetId: emptySubjects[0]._id,
      targetName: `Bulk move to bin: ${emptySubjects.length} subjects`,
      action: 'soft_delete',
      performedBy: req.user._id,
      details: `Moved ${emptySubjects.length} empty subjects to Recycle Bin (30-day retention): ${names}`,
    });

    res.json({
      message: `Moved ${emptySubjects.length} empty subjects to Recycle Bin (30-day retention).`,
      deletedCount: emptySubjects.length,
      deletedSubjects: emptySubjects.map((s) => ({ name: s.name, class: s.classRef?.name })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
