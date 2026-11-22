import { Router } from 'express';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// POST /toggle — Subscribe/Unsubscribe to a teacher
router.post('/toggle', async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ message: 'teacherId is required' });

    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    if (teacherId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot subscribe to yourself' });
    }

    const existing = await Subscription.findOne({
      subscriberRef: req.user._id,
      teacherRef: teacherId,
    });

    if (existing) {
      await Subscription.deleteOne({ _id: existing._id });
      await User.findByIdAndUpdate(teacherId, { $inc: { subscriberCount: -1 } });
      return res.json({ subscribed: false, message: 'Unsubscribed successfully' });
    }

    await Subscription.create({
      subscriberRef: req.user._id,
      teacherRef: teacherId,
    });
    await User.findByIdAndUpdate(teacherId, { $inc: { subscriberCount: 1 } });

    // Notify the teacher about new subscriber
    await Notification.create({
      userRef: teacherId,
      type: 'new_subscriber',
      title: 'A new subscriber added!',
      message: `${req.user.name} has subscribed to you.`,
      subscriberRef: req.user._id,
      teacherRef: req.user._id,
      link: '/teacher/dashboard',
    });

    res.json({ subscribed: true, message: 'Subscribed successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /my — Get user's subscriptions
router.get('/my', async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ subscriberRef: req.user._id })
      .populate('teacherRef', 'name avatar subscriberCount')
      .sort({ subscribedAt: -1 });

    const result = subscriptions.map((sub) => ({
      _id: sub._id,
      teacher: sub.teacherRef,
      emailNotify: sub.emailNotify,
      webNotify: sub.webNotify,
      subscribedAt: sub.subscribedAt,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /teacher/list — Get teacher's subscriber list
router.get('/teacher/list', requireRole('teacher'), async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ teacherRef: req.user._id })
      .populate('subscriberRef', 'name email avatar')
      .sort({ subscribedAt: -1 });

    const result = subscriptions.map((sub) => ({
      _id: sub._id,
      subscriber: sub.subscriberRef,
      subscribedAt: sub.subscribedAt,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /teacher/count — Get subscriber count
router.get('/teacher/count', requireRole('teacher'), async (req, res, next) => {
  try {
    const count = await Subscription.countDocuments({ teacherRef: req.user._id });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// GET /check/:teacherId — Check if current user is subscribed
router.get('/check/:teacherId', async (req, res, next) => {
  try {
    const existing = await Subscription.findOne({
      subscriberRef: req.user._id,
      teacherRef: req.params.teacherId,
    });
    const user = await User.findById(req.user._id).select('mutedTeachers');
    const isMuted =
      user?.mutedTeachers?.some(
        (m) => m.toString() === req.params.teacherId.toString()
      ) || (existing && existing.webNotify === false);

    res.json({
      subscribed: !!existing,
      webNotify: existing ? existing.webNotify : true,
      muted: !!isMuted,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /preferences — Update notification preferences
router.patch('/preferences', requireRole('student'), async (req, res, next) => {
  try {
    const { teacherId, emailNotify, webNotify } = req.body;
    if (!teacherId) return res.status(400).json({ message: 'teacherId is required' });

    const subscription = await Subscription.findOne({
      subscriberRef: req.user._id,
      teacherRef: teacherId,
    });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

    if (typeof emailNotify === 'boolean') subscription.emailNotify = emailNotify;
    if (typeof webNotify === 'boolean') subscription.webNotify = webNotify;
    await subscription.save();

    res.json({ message: 'Preferences updated', subscription });
  } catch (err) {
    next(err);
  }
});

export default router;
