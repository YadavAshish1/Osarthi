import { Router } from 'express';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';
import TaxonomyAuditLog from '../models/TaxonomyAuditLog.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

export async function seedDefaultTaxonomy() {
  try {
    const superAdmin = await User.findOne({ role: 'super_admin' });
    const defaultClasses = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'General'];
    for (const name of defaultClasses) {
      const existing = await Class.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
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
    const classes = await Class.find().sort({ name: 1 }).select('name _id');
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
      const cls = await Class.findById(req.user.classRef);
      return res.json(cls ? [cls] : []);
    }
    // Return all classes from database
    const classes = await Class.find().sort({ name: 1 });
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
    const filter = { classRef: classId };
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
    const classes = await Class.find().sort({ name: 1 }).populate('createdBy', 'name email');
    const subjects = await Subject.find().sort({ name: 1 }).populate('classRef', 'name').populate('createdBy', 'name email');
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

    const existing = await Class.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
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
    const cls = await Class.findById(id);
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

    const cls = await Class.findById(classId);
    if (!cls) return res.status(400).json({ message: 'Invalid Class specified' });

    const existing = await Subject.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      classRef: classId,
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
    const subject = await Subject.findById(id).populate('classRef', 'name');
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

export default router;
