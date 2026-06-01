import { Router } from 'express';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

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
    const classes = await Class.find({ createdBy: req.user._id }).sort({ name: 1 });
    res.json(classes);
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
      createdBy: req.user._id,
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
    if (req.user.role === 'teacher') {
      filter.createdBy = req.user._id;
    } else if (req.user.classRef?.toString() !== classId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const subjects = await Subject.find(filter).sort({ name: 1 });
    res.json(subjects);
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
      createdBy: req.user._id,
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
    res.json(topics);
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

export default router;
