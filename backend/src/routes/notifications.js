import { Router } from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const isHidden = req.query.hidden === 'true';
    const notifications = await Notification.find({
      userRef: req.user._id,
      hidden: isHidden ? true : { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('quizRef', 'title')
      .populate('contentRef', 'title')
      .populate('teacherRef', 'name avatar')
      .populate('subscriberRef', 'name avatar');
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userRef: req.user._id,
      read: false,
      hidden: { $ne: true },
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

router.get('/hidden-count', async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userRef: req.user._id,
      hidden: true,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userRef: req.user._id },
      { read: true },
      { new: true }
    );
    res.json(n);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/hide', async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userRef: req.user._id },
      { hidden: true },
      { new: true }
    );
    res.json({ message: 'Notification hidden', notification: n });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/unhide', async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userRef: req.user._id },
      { hidden: false },
      { new: true }
    );
    res.json({ message: 'Notification unhidden', notification: n });
  } catch (err) {
    next(err);
  }
});

router.patch('/unhide-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userRef: req.user._id, hidden: true },
      { hidden: false }
    );
    res.json({ message: 'All hidden notifications unhidden' });
  } catch (err) {
    next(err);
  }
});

router.get('/muted-teachers', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('mutedTeachers', 'name avatar bio subjects')
      .select('mutedTeachers');
    res.json(user?.mutedTeachers || []);
  } catch (err) {
    next(err);
  }
});

router.post('/mute-teacher', async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ message: 'teacherId is required' });

    // 1. Add teacherId to user's mutedTeachers list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { mutedTeachers: teacherId },
    });

    // 2. Set webNotify: false on Subscription if user is subscribed
    await Subscription.updateOne(
      { subscriberRef: req.user._id, teacherRef: teacherId },
      { webNotify: false }
    );

    res.json({ message: 'Notifications turned off from this teacher' });
  } catch (err) {
    next(err);
  }
});

router.post('/unmute-teacher', async (req, res, next) => {
  try {
    const { teacherId, unhidePast = true } = req.body;
    if (!teacherId) return res.status(400).json({ message: 'teacherId is required' });

    // 1. Remove teacherId from user's mutedTeachers list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { mutedTeachers: teacherId },
    });

    // 2. Set webNotify: true on Subscription if user is subscribed
    await Subscription.updateOne(
      { subscriberRef: req.user._id, teacherRef: teacherId },
      { webNotify: true }
    );

    // 3. Optionally unhide past notifications
    if (unhidePast) {
      await Notification.updateMany(
        { userRef: req.user._id, teacherRef: teacherId },
        { hidden: false }
      );
    }

    res.json({ message: 'Notifications turned back on for this teacher' });
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ userRef: req.user._id }, { read: true });
    res.json({ message: 'All marked read' });
  } catch (err) {
    next(err);
  }
});

router.delete('/clear-all', async (req, res, next) => {
  try {
    await Notification.deleteMany({ userRef: req.user._id });
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userRef: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
