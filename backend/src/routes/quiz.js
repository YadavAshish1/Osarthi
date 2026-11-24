import { Router } from 'express';
import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import QuizCollection from '../models/QuizCollection.js';
import Subscription from '../models/Subscription.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { sendQuizNotificationEmail, sendCollectionNotificationEmail } from '../utils/emailService.js';

const router = Router();

router.use(authenticate);


function evaluateAnswer(question, selectedOptionIds) {
  const correct = [...(question.correctOptionIds || [])].sort().join(',');
  const selected = [...(selectedOptionIds || [])].sort().join(',');
  return Boolean(correct) && correct === selected;
}

function buildSuggestions(questions, answers) {
  return questions
    .filter((q) => {
      const ans = answers.find((a) => a.questionId === q.id);
      return ans && !ans.isCorrect && q.explanation;
    })
    .map((q) => q.explanation);
}

// ─── TEACHER QUIZ ANALYTICS ────────────────────────────────────────────────

// Overall analytics for the logged-in teacher

router.get('/teacher/analytics', requireRole('teacher'), async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    const quizzes = await Quiz.find({ createdBy: teacherId })
      .populate('subjectRef', 'name')
      .populate('classRef', 'name')
      .sort({ createdAt: -1 });

    const quizIds = quizzes.map((q) => q._id);

    const attempts = await QuizAttempt.find({ quizRef: { $in: quizIds } })
      .populate('studentRef', 'name email avatar')
      .sort({ submittedAt: -1 });

    const totalQuizzes = quizzes.length;
    const publishedQuizzes = quizzes.filter((q) => q.published).length;
    const totalAttempts = attempts.length;

    // Unique students who attempted
    const uniqueStudentSet = new Set(attempts.map((a) => a.studentRef?._id?.toString() || a.studentRef?.toString()));
    const totalUniqueStudents = uniqueStudentSet.size;

    // Overall Average score
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts)
      : 0;

    // Pass rate (percentage >= 60%)
    const passedAttempts = attempts.filter((a) => (a.percentage || 0) >= 60).length;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

    // Top quiz by attempts
    const quizAttemptCounts = {};
    attempts.forEach((a) => {
      const qid = a.quizRef?.toString();
      quizAttemptCounts[qid] = (quizAttemptCounts[qid] || 0) + 1;
    });

    const quizzesWithStats = quizzes.map((quiz) => {
      const qAttempts = attempts.filter((a) => a.quizRef?.toString() === quiz._id.toString());
      const count = qAttempts.length;
      const qAvg = count > 0 ? Math.round(qAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / count) : 0;
      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        published: quiz.published,
        subjectName: quiz.subjectRef?.name || 'General',
        className: quiz.classRef?.name || 'General',
        difficulty: quiz.difficulty || 'medium',
        hasTimer: quiz.hasTimer || false,
        timeLimitMinutes: quiz.timeLimitMinutes,
        instructions: quiz.instructions || '',
        isClosed: quiz.isClosed || false,
        closedAt: quiz.closedAt || null,
        expiresAt: quiz.expiresAt || null,
        createdAt: quiz.createdAt,
        publishedAt: quiz.publishedAt,
        attemptCount: count,
        avgScore: qAvg,
      };
    });

    res.json({
      totalQuizzes,
      publishedQuizzes,
      totalAttempts,
      totalUniqueStudents,
      avgScore,
      passRate,
      quizzes: quizzesWithStats,
      recentAttempts: attempts.slice(0, 10).map((a) => {
        const matchingQuiz = quizzes.find((q) => q._id.toString() === a.quizRef?.toString());
        return {
          _id: a._id,
          quizId: a.quizRef,
          quizTitle: matchingQuiz?.title || 'Quiz',
          student: a.studentRef,
          score: a.score,
          totalQuestions: a.totalQuestions,
          percentage: a.percentage,
          timeTakenSeconds: a.timeTakenSeconds,
          submittedAt: a.submittedAt,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});


// ─── QUIZ SERIES / TEST SERIES ─────────────────────────────────────────────

// Create Quiz Collection
router.post('/collections', requireRole('teacher'), async (req, res, next) => {
  try {
    const { title, description, type, coverImage, subjectRef, classRef, topicRef, tags } = req.body;
    if (!title) return res.status(400).json({ message: 'Collection title is required' });

    const collection = await QuizCollection.create({
      title,
      description: description || '',
      type: type || 'custom',
      coverImage: coverImage || '',
      subjectRef: subjectRef || null,
      classRef: classRef || null,
      topicRef: topicRef || null,
      tags: tags || [],
      createdBy: req.user._id,
    });

    // Optional notification to subscribers when collection is created
    const subscribers = await Subscription.find({
      teacherRef: req.user._id,
      webNotify: { $ne: false },
    }).populate('subscriberRef', 'name email mutedTeachers');
    const teacherIdStr = req.user._id.toString();
    const webNotifs = subscribers
      .filter((s) => {
        if (!s.subscriberRef?._id) return false;
        const muted = s.subscriberRef.mutedTeachers || [];
        return !muted.some((m) => m.toString() === teacherIdStr);
      })
      .map((s) => ({
        userRef: s.subscriberRef._id,
        type: 'collection_created',
        title: `New Test Series: ${collection.title}`,
        message: `${req.user.name} published a new Test Series: "${collection.title}".`,
        teacherRef: req.user._id,
        collectionRef: collection._id,
      }));

    if (webNotifs.length > 0) {
      await Notification.insertMany(webNotifs);
    }

    subscribers.forEach((s) => {
      if (s.emailNotify && s.subscriberRef?.email) {
        sendCollectionNotificationEmail(
          s.subscriberRef.email,
          s.subscriberRef.name,
          req.user.name,
          collection.title,
          collection.description
        ).catch((err) => console.error('[Collection Email Error]', err));
      }
    });

    res.status(201).json(collection);
  } catch (err) {
    next(err);
  }
});

// Get all collections for the logged-in teacher
router.get('/collections/teacher', requireRole('teacher'), async (req, res, next) => {
  try {
    const collections = await QuizCollection.find({ createdBy: req.user._id })
      .populate('subjectRef', 'name')
      .populate('classRef', 'name')
      .populate('topicRef', 'name')
      .populate({
        path: 'quizzes',
        select: 'title description timeLimitMinutes questions difficulty published attemptCount avgScore',
      })
      .sort({ createdAt: -1 });

    res.json(collections);
  } catch (err) {
    next(err);
  }
});

// Public collections for students to browse
router.get('/collections/public', async (req, res, next) => {
  try {
    const { classRef, subjectRef, type } = req.query;
    const filter = { isPublic: true };

    if (classRef) filter.classRef = classRef;
    if (subjectRef) filter.subjectRef = subjectRef;
    if (type) filter.type = type;

    const collections = await QuizCollection.find(filter)
      .populate('createdBy', 'name avatar subscriberCount')
      .populate('subjectRef', 'name')
      .populate('classRef', 'name')
      .populate({
        path: 'quizzes',
        match: { published: true },
        select: 'title timeLimitMinutes difficulty attemptCount avgScore questions',
      })
      .sort({ createdAt: -1 });

    res.json(collections);
  } catch (err) {
    next(err);
  }
});

// Public view of a single collection
router.get('/collections/public/:id', async (req, res, next) => {
  try {
    const collection = await QuizCollection.findOne({ _id: req.params.id, isPublic: true })
      .populate('createdBy', 'name avatar subscriberCount bio')
      .populate('subjectRef', 'name')
      .populate('classRef', 'name')
      .populate('topicRef', 'name')
      .populate({
        path: 'quizzes',
        match: { published: true },
        select: 'title description timeLimitMinutes difficulty attemptCount avgScore questions createdAt',
      });

    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    res.json(collection);
  } catch (err) {
    next(err);
  }
});

// Update collection
router.put('/collections/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const collection = await QuizCollection.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    res.json(collection);
  } catch (err) {
    next(err);
  }
});

// Delete collection (quizzes remain intact)
router.delete('/collections/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const collection = await QuizCollection.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    // Unlink collection reference from quizzes
    await Quiz.updateMany({ collectionRef: collection._id }, { $unset: { collectionRef: '' } });

    res.json({ message: 'Collection deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Add quiz to collection
router.post('/collections/:id/add-quiz', requireRole('teacher'), async (req, res, next) => {
  try {
    const { quizId } = req.body;
    if (!quizId) return res.status(400).json({ message: 'quizId is required' });

    const collection = await QuizCollection.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (!collection.quizzes.includes(quizId)) {
      collection.quizzes.push(quizId);
      await collection.save();
    }

    // Also link quiz to collection
    await Quiz.findByIdAndUpdate(quizId, { collectionRef: collection._id });

    res.json({ message: 'Quiz added to collection', collection });
  } catch (err) {
    next(err);
  }
});

// Remove quiz from collection
router.delete('/collections/:id/remove-quiz/:quizId', requireRole('teacher'), async (req, res, next) => {
  try {
    const collection = await QuizCollection.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    collection.quizzes = collection.quizzes.filter((id) => id.toString() !== req.params.quizId);
    await collection.save();

    await Quiz.findByIdAndUpdate(req.params.quizId, { $unset: { collectionRef: '' } });

    res.json({ message: 'Quiz removed from collection', collection });
  } catch (err) {
    next(err);
  }
});

// ─── STANDARD QUIZ CRUD ───────────────────────────────────────────────────


router.get('/teacher', requireRole('teacher'), async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .populate('subjectRef', 'name')
      .populate('classRef', 'name')
      .populate('collectionRef', 'title type')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    next(err);
  }
});

export async function notifySubscribersOfQuiz(quiz, teacher) {
  try {
    const populatedQuiz = await Quiz.findById(quiz._id).populate('subjectRef', 'name');
    const subscriptions = await Subscription.find({
      teacherRef: teacher._id,
      webNotify: { $ne: false },
    }).populate('subscriberRef', 'name email mutedTeachers');
    const classStudents = quiz.classRef
      ? await User.find({ role: 'student', classRef: quiz.classRef }).select('name email mutedTeachers')
      : [];

    const teacherIdStr = teacher._id.toString();
    const notifiedUserIds = new Set();
    const notificationsToInsert = [];

    subscriptions.forEach((sub) => {
      if (sub.subscriberRef?._id) {
        const muted = sub.subscriberRef.mutedTeachers || [];
        if (muted.some((m) => m.toString() === teacherIdStr)) return;
        const uid = sub.subscriberRef._id.toString();
        notifiedUserIds.add(uid);
        notificationsToInsert.push({
          userRef: sub.subscriberRef._id,
          type: 'quiz_published',
          title: `New Quiz from ${teacher.name}`,
          message: `"${quiz.title}" is now available in ${populatedQuiz?.subjectRef?.name || 'your subject'}.`,
          quizRef: quiz._id,
          teacherRef: teacher._id,
          collectionRef: quiz.collectionRef,
          link: `/quiz/${quiz._id}`,
        });
      }
    });

    classStudents.forEach((student) => {
      const muted = student.mutedTeachers || [];
      if (muted.some((m) => m.toString() === teacherIdStr)) return;
      const uid = student._id.toString();
      if (!notifiedUserIds.has(uid)) {
        notifiedUserIds.add(uid);
        notificationsToInsert.push({
          userRef: student._id,
          type: 'quiz_published',
          title: 'New quiz live',
          message: `"${quiz.title}" is now available in ${populatedQuiz?.subjectRef?.name || 'your subject'}.`,
          quizRef: quiz._id,
          teacherRef: teacher._id,
          link: `/quiz/${quiz._id}`,
        });
      }
    });

    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert);
    }

    const clientUrl = process.env.PUBLIC_APP_URL || process.env.SITE_URL || 'https://www.medhashine.in';
    const baseUrl = clientUrl.includes('localhost') ? 'https://www.medhashine.in' : clientUrl.replace(/\/+$/, '');
    const quizLink = `${baseUrl}/quiz/${quiz._id}`;
    subscriptions.forEach((sub) => {
      if (sub.emailNotify && sub.subscriberRef?.email) {
        sendQuizNotificationEmail(
          sub.subscriberRef.email,
          sub.subscriberRef.name,
          teacher.name,
          quiz.title,
          quiz.description,
          quizLink
        ).catch((err) => console.error('[Quiz Email Notification Error]', err));
      }
    });
  } catch (err) {
    console.error('[Quiz Notification Error]', err);
  }
}

router.post('/', requireRole('teacher'), async (req, res, next) => {
  try {
    const quiz = await Quiz.create({
      ...req.body,
      createdBy: req.user._id,
      publishedAt: req.body.published ? new Date() : null,
    });

    // If a collectionRef was specified, add this quiz to the collection
    if (quiz.collectionRef) {
      await QuizCollection.findByIdAndUpdate(quiz.collectionRef, {
        $addToSet: { quizzes: quiz._id },
      });
    }

    if (quiz.published) {
      notifySubscribersOfQuiz(quiz, req.user);
    }

    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});


// ─── STUDENT & ATTEMPT ROUTES (PLACED BEFORE /:id TO PREVENT PARAMETER COLLISIONS) ───

// Live quizzes (open to all students without class/subject restrictions)
router.get('/student/live', async (req, res, next) => {
  try {
    const now = new Date();
    const filter = {
      published: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };
    if (req.query.classRef) {
      filter.classRef = req.query.classRef;
    }
    if (req.query.subjectRef) {
      filter.subjectRef = req.query.subjectRef;
    }
    const quizzes = await Quiz.find(filter)
      .populate('subjectRef', 'name')
      .populate('createdBy', 'name avatar')
      .populate('collectionRef', 'title type')
      .sort({ publishedAt: -1 });
    res.json(quizzes);
  } catch (err) {
    next(err);
  }
});

// Get full history of attempted quizzes (students, teachers, admins)
router.get('/student/attempts', async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ studentRef: req.user._id })
      .sort({ submittedAt: -1 })
      .populate({
        path: 'quizRef',
        select: 'title description difficulty subjectRef classRef createdBy hasTimer timeLimitMinutes instructions',
        populate: [
          { path: 'subjectRef', select: 'name' },
          { path: 'classRef', select: 'name' },
          { path: 'createdBy', select: 'name avatar' },
        ],
      });

    res.json(attempts);
  } catch (err) {
    next(err);
  }
});

// Quizzes by subject (open to all students without class restrictions)
router.get('/student/by-subject/:subjectId', async (req, res, next) => {
  try {
    const filter = {
      subjectRef: req.params.subjectId,
      published: true,
    };
    if (req.query.classRef) {
      filter.classRef = req.query.classRef;
    }
    const quizzes = await Quiz.find(filter)
      .populate('subjectRef', 'name')
      .populate('createdBy', 'name avatar')
      .populate('collectionRef', 'title type')
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
          createdBy: quiz.createdBy,
          difficulty: quiz.difficulty,
          collection: quiz.collectionRef,
          publishedAt: quiz.publishedAt,
          expiresAt: quiz.expiresAt,
          timeLimitMinutes: quiz.timeLimitMinutes,
          attemptCount: quiz.attemptCount,
          avgScore: quiz.avgScore,
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

// View attempt result
router.get('/attempt/:id', async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Attempt not found' });
  try {
    const attempt = await QuizAttempt.findOne({
      _id: req.params.id,
    }).populate({
      path: 'quizRef',
      populate: [
        { path: 'subjectRef', select: 'name' },
        { path: 'createdBy', select: 'name avatar' },
      ],
    });
    if (!attempt) return res.status(404).json({ message: 'Not found' });

    const isStudent = attempt.studentRef.toString() === req.user._id.toString();
    const isQuizAuthor = attempt.quizRef?.createdBy?._id?.toString() === req.user._id.toString();
    if (!isStudent && !isQuizAuthor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const quiz = await Quiz.findById(attempt.quizRef);
    const details = attempt.answers.map((a) => {
      const q = quiz.questions.find((x) => x.id === a.questionId);
      return {
        questionId: a.questionId,
        questionText: q?.text,
        type: q?.type || 'single',
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


// ─── SPECIFIC QUIZ ACCESS & ACTIONS ────────────────────────────────────────



// Student or Teacher: Take quiz
router.get('/:id/take', async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Quiz not found' });
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('subjectRef', 'name')
      .populate('createdBy', 'name avatar')
      .populate('collectionRef', 'title type');

    if (!quiz || !quiz.published) return res.status(404).json({ message: 'Quiz not found' });

    if (req.user.role === 'student') {
      if (quiz.isClosed) {
        return res.status(410).json({
          message: 'This quiz is closed by the educator and is no longer accepting submissions.',
          isClosed: true,
        });
      }
      if (quiz.expiresAt && new Date() > quiz.expiresAt) {
        return res.status(410).json({
          message: 'The deadline for this quiz has passed and submissions are closed.',
          isExpired: true,
          expiresAt: quiz.expiresAt,
        });
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

// Submit quiz attempt
router.post('/:id/submit', async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Quiz not found' });
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.published) return res.status(404).json({ message: 'Quiz not found' });
    if (quiz.isClosed) {
      return res.status(410).json({ message: 'This quiz is closed by the educator and is no longer accepting submissions.' });
    }
    if (quiz.expiresAt && new Date() > quiz.expiresAt) {
      return res.status(410).json({ message: 'This quiz has expired and is no longer accepting submissions.' });
    }

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

    const existing = await QuizAttempt.findOne({
      quizRef: quiz._id,
      studentRef: req.user._id,
    });
    if (existing) {
      return res.status(200).json({
        attempt: existing,
        details: evaluated.map((e) => {
          const q = quiz.questions.find((x) => x.id === e.questionId);
          return {
            questionId: e.questionId,
            questionText: q?.text,
            type: q?.type || 'single',
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
        message: 'Quiz already submitted',
      });
    }

    const score = evaluated.filter((e) => e.isCorrect).length;
    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
    const suggestions = buildSuggestions(quiz.questions, evaluated);

    let attempt;
    try {
      attempt = await QuizAttempt.create({
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
    } catch (createErr) {
      if (createErr.code === 11000) {
        attempt = await QuizAttempt.findOne({ quizRef: quiz._id, studentRef: req.user._id });
        if (!attempt) throw createErr;
      } else {
        throw createErr;
      }
    }

    // Update attemptCount and avgScore cached on Quiz model
    const allAttempts = await QuizAttempt.find({ quizRef: quiz._id }).select('percentage');
    const count = allAttempts.length;
    const avg = Math.round(allAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / count);

    await Quiz.findByIdAndUpdate(quiz._id, {
      attemptCount: count,
      avgScore: avg,
    });

    res.status(201).json({
      attempt,
      details: evaluated.map((e) => {
        const q = quiz.questions.find((x) => x.id === e.questionId);
        return {
          questionId: e.questionId,
          questionText: q?.text,
          type: q?.type || 'single',
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


// List all attempts for a specific quiz (Teacher only)
router.get('/:id/attempts', requireRole('teacher'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Quiz not found' });
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found or unauthorized' });

    const attempts = await QuizAttempt.find({ quizRef: quiz._id })
      .populate('studentRef', 'name email avatar')
      .sort({ submittedAt: -1 });

    res.json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        totalQuestions: quiz.questions?.length || 0,
      },
      attempts: attempts.map((a) => ({
        _id: a._id,
        student: a.studentRef,
        score: a.score,
        totalQuestions: a.totalQuestions,
        percentage: a.percentage,
        timeTakenSeconds: a.timeTakenSeconds,
        submittedAt: a.submittedAt,
        answers: a.answers,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// Per-quiz detailed analytics (Question-level breakdown)
router.get('/:id/analytics', requireRole('teacher'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Quiz not found' });
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found or unauthorized' });

    const attempts = await QuizAttempt.find({ quizRef: quiz._id }).populate('studentRef', 'name');

    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts)
      : 0;

    const avgTimeSeconds = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.timeTakenSeconds || 0), 0) / totalAttempts)
      : 0;

    // Per-question accuracy calculation
    const questionStats = (quiz.questions || []).map((q) => {
      let correctCount = 0;
      let totalAnswered = 0;

      attempts.forEach((attempt) => {
        const studentAns = attempt.answers?.find((ans) => ans.questionId === q.id);
        if (studentAns) {
          totalAnswered += 1;
          if (studentAns.isCorrect) correctCount += 1;
        }
      });

      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

      return {
        id: q.id,
        text: q.text,
        type: q.type,
        totalAnswered,
        correctCount,
        accuracyPercentage: accuracy,
      };
    });

    // Score distribution (buckets: 0-25, 26-50, 51-75, 76-100)
    const scoreDistribution = {
      '0-25%': attempts.filter((a) => a.percentage <= 25).length,
      '26-50%': attempts.filter((a) => a.percentage > 25 && a.percentage <= 50).length,
      '51-75%': attempts.filter((a) => a.percentage > 50 && a.percentage <= 75).length,
      '76-100%': attempts.filter((a) => a.percentage > 75).length,
    };

    res.json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        totalQuestions: quiz.questions?.length || 0,
      },
      totalAttempts,
      avgScore,
      avgTimeSeconds,
      scoreDistribution,
      questionStats,
    });
  } catch (err) {
    next(err);
  }
});


// Teacher: Get single quiz for editing
router.get('/:id', requireRole('teacher'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Quiz not found' });
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('subjectRef', 'name')
      .populate('classRef', 'name')
      .populate('topicRef', 'name')
      .populate('collectionRef', 'title');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

// Teacher: Update an existing quiz
router.put('/:id', requireRole('teacher'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Quiz not found' });
  try {
    const existing = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!existing) return res.status(404).json({ message: 'Quiz not found' });

    const oldCollection = existing.collectionRef?.toString();
    const newCollection = req.body.collectionRef ? req.body.collectionRef.toString() : null;

    if (oldCollection !== newCollection) {
      if (oldCollection) {
        await QuizCollection.findByIdAndUpdate(oldCollection, {
          $pull: { quizzes: existing._id },
        });
      }
      if (newCollection) {
        await QuizCollection.findByIdAndUpdate(newCollection, {
          $addToSet: { quizzes: existing._id },
        });
      }
    }

    const wasPublished = existing.published;
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(req.body.published && !wasPublished && { publishedAt: new Date() }),
      },
      { new: true, runValidators: true }
    );

    if (quiz && quiz.published && !wasPublished) {
      notifySubscribersOfQuiz(quiz, req.user);
    }

    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

// Teacher: Toggle close / reopen quiz manually
router.patch('/:id/toggle-close', requireRole('teacher'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Quiz not found' });
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const willBeClosed = !quiz.isClosed;
    quiz.isClosed = willBeClosed;
    quiz.closedAt = willBeClosed ? new Date() : null;
    await quiz.save();

    res.json({
      message: willBeClosed ? 'Quiz closed successfully' : 'Quiz reopened successfully',
      isClosed: quiz.isClosed,
      closedAt: quiz.closedAt,
    });
  } catch (err) {
    next(err);
  }
});

// Teacher: Delete quiz
router.delete('/:id', requireRole('teacher'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Quiz not found' });
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (quiz.collectionRef) {
      await QuizCollection.findByIdAndUpdate(quiz.collectionRef, {
        $pull: { quizzes: quiz._id },
      });
    }
    await QuizAttempt.deleteMany({ quizRef: quiz._id });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Publish quiz: Notify class students AND subscribed students (web + email)
router.post('/:id/publish', requireRole('teacher'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Quiz not found' });
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { published: true, publishedAt: new Date() },
      { new: true }
    ).populate('subjectRef', 'name');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    notifySubscribersOfQuiz(quiz, req.user);

    res.json({ quiz, message: 'Quiz published and notifications dispatched' });
  } catch (err) {
    next(err);
  }
});

export default router;
