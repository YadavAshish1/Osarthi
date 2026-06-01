import { Router } from 'express';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userRef: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('quizRef', 'title');
    res.json(notifications);
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

router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ userRef: req.user._id }, { read: true });
    res.json({ message: 'All marked read' });
  } catch (err) {
    next(err);
  }
});

export default router;
