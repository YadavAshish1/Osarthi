import { Router } from 'express';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

function evaluateAnswer(question, selectedOptionIds) {
  const correct = [...question.correctOptionIds].sort().join(',');
  const selected = [...(selectedOptionIds || [])].sort().join(',');
  return correct === selected;
}

function buildSuggestions(questions, answers) {
  return questions
    .filter((q) => {
      const ans = answers.find((a) => a.questionId === q.id);
      return ans && !ans.isCorrect && q.explanation;
    })
    .map((q) => q.explanation);
}

router.get('/teacher', requireRole('teacher'), async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .populate('subjectRef', 'name')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('teacher'), async (req, res, next) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/publish', requireRole('teacher'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { published: true, publishedAt: new Date() },
      { new: true }
    ).populate('subjectRef', 'name');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const students = await User.find({
      role: 'student',
      classRef: quiz.classRef,
    });

    await Notification.insertMany(
      students.map((s) => ({
        userRef: s._id,
        type: 'quiz_published',
        title: 'New quiz live',
        message: `"${quiz.title}" is now available in ${quiz.subjectRef?.name || 'your subject'}.`,
        quizRef: quiz._id,
      }))
    );

    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

router.get('/student/live', requireRole('student'), async (req, res, next) => {
  try {
    const now = new Date();
    const quizzes = await Quiz.find({
      published: true,
      classRef: req.user.classRef,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .populate('subjectRef', 'name')
      .sort({ publishedAt: -1 });
    res.json(quizzes);
  } catch (err) {
    next(err);
  }
});

router.get('/student/by-subject/:subjectId', requireRole('student'), async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({
      subjectRef: req.params.subjectId,
      published: true,
      classRef: req.user.classRef,
    })
      .populate('subjectRef', 'name')
      .sort({ createdAt: -1 });

    const attempts = await QuizAttempt.find({
      studentRef: req.user._id,
      quizRef: { $in: quizzes.map((q) => q._id) },
    });

    const result = quizzes.map((quiz) => {
      const attempt = attempts.find((a) => a.quizRef.toString() === quiz._id.toString());
      return {
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          subject: quiz.subjectRef,
          publishedAt: quiz.publishedAt,
          expiresAt: quiz.expiresAt,
          timeLimitMinutes: quiz.timeLimitMinutes,
          createdAt: quiz.createdAt,
        },
        attempted: !!attempt,
        attempt: attempt
          ? {
              _id: attempt._id,
              score: attempt.score,
              totalQuestions: attempt.totalQuestions,
              percentage: attempt.percentage,
              submittedAt: attempt.submittedAt,
              suggestions: attempt.suggestions,
            }
          : null,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/take', async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('subjectRef', 'name');
    if (!quiz || !quiz.published) return res.status(404).json({ message: 'Quiz not found' });

    if (req.user.role === 'student') {
      if (quiz.classRef.toString() !== req.user.classRef?.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      if (quiz.expiresAt && new Date() > quiz.expiresAt) {
        return res.status(410).json({ message: 'Quiz has expired' });
      }
      const existing = await QuizAttempt.findOne({
        quizRef: quiz._id,
        studentRef: req.user._id,
      });
      if (existing) return res.status(409).json({ message: 'Already attempted', attemptId: existing._id });
    }

    const safe = quiz.toObject();
    safe.questions = safe.questions.map((q) => {
      const { correctOptionIds, explanation, ...rest } = q;
      return rest;
    });
    res.json(safe);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/submit', requireRole('student'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.published) return res.status(404).json({ message: 'Quiz not found' });
    if (quiz.classRef.toString() !== req.user.classRef?.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (quiz.expiresAt && new Date() > quiz.expiresAt) {
      return res.status(410).json({ message: 'Quiz has expired' });
    }

    const existing = await QuizAttempt.findOne({
      quizRef: quiz._id,
      studentRef: req.user._id,
    });
    if (existing) return res.status(409).json({ message: 'Already attempted' });

    const { answers: rawAnswers, timeTakenSeconds } = req.body;
    const evaluated = quiz.questions.map((q) => {
      const submitted = rawAnswers?.find((a) => a.questionId === q.id);
      const selectedOptionIds = submitted?.selectedOptionIds || [];
      const isCorrect = evaluateAnswer(q, selectedOptionIds);
      return {
        questionId: q.id,
        selectedOptionIds,
        isCorrect,
        correctOptionIds: q.correctOptionIds,
        explanation: q.explanation,
      };
    });

    const score = evaluated.filter((e) => e.isCorrect).length;
    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
    const suggestions = buildSuggestions(quiz.questions, evaluated);

    const attempt = await QuizAttempt.create({
      quizRef: quiz._id,
      studentRef: req.user._id,
      answers: evaluated.map(({ questionId, selectedOptionIds, isCorrect }) => ({
        questionId,
        selectedOptionIds,
        isCorrect,
      })),
      score,
      totalQuestions,
      percentage,
      timeTakenSeconds: timeTakenSeconds || 0,
      suggestions,
    });

    res.status(201).json({
      attempt,
      details: evaluated.map((e) => {
        const q = quiz.questions.find((x) => x.id === e.questionId);
        return {
          questionId: e.questionId,
          questionText: q?.text,
          selectedOptionIds: e.selectedOptionIds,
          correctOptionIds: e.correctOptionIds,
          isCorrect: e.isCorrect,
          explanation: e.explanation,
          options: q?.options,
        };
      }),
      quiz: {
        title: quiz.title,
        subjectRef: quiz.subjectRef,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/attempt/:id', requireRole('student'), async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findOne({
      _id: req.params.id,
      studentRef: req.user._id,
    }).populate({
      path: 'quizRef',
      populate: { path: 'subjectRef', select: 'name' },
    });
    if (!attempt) return res.status(404).json({ message: 'Not found' });

    const quiz = await Quiz.findById(attempt.quizRef);
    const details = attempt.answers.map((a) => {
      const q = quiz.questions.find((x) => x.id === a.questionId);
      return {
        questionId: a.questionId,
        questionText: q?.text,
        selectedOptionIds: a.selectedOptionIds,
        correctOptionIds: q?.correctOptionIds,
        isCorrect: a.isCorrect,
        explanation: q?.explanation,
        options: q?.options,
      };
    });

    res.json({ attempt, details, quiz });
  } catch (err) {
    next(err);
  }
});

export default router;
