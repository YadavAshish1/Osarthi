import { Router } from 'express';
import TeacherApplication from '../models/TeacherApplication.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  sendTeacherApplicationAdminNotification,
  sendTeacherApprovalEmail,
  sendTeacherRejectionEmail,
} from '../utils/emailService.js';

const router = Router();

// ─── POST /api/teacher-applications — Submit a new application ──────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      name, email, phone, dateOfBirth, avatar,
      education, subjects, requestedSubjects, experience, bio, motivation,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Link to authenticated or existing user account
    let applicantRef = null;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../utils/tokens.js');
        const decoded = verifyAccessToken(header.slice(7));
        const user = await User.findById(decoded.userId);
        if (user) applicantRef = user._id;
      } catch {}
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && !applicantRef) {
      applicantRef = existingUser._id;
    }

    // Upsert (create or update) application
    let application = await TeacherApplication.findOne({ email: cleanEmail });

    if (application) {
      application.name = name.trim();
      application.phone = phone?.trim() || application.phone || '';
      if (dateOfBirth) application.dateOfBirth = dateOfBirth;
      if (avatar) application.avatar = avatar;
      if (Array.isArray(education)) application.education = education;
      if (Array.isArray(subjects)) application.subjects = subjects;
      if (Array.isArray(requestedSubjects)) application.requestedSubjects = requestedSubjects;
      if (Array.isArray(experience)) application.experience = experience;
      if (bio?.trim()) application.bio = bio.trim();
      if (motivation?.trim()) application.motivation = motivation.trim();
      if (applicantRef) application.applicantRef = applicantRef;
      await application.save();
    } else {
      application = await TeacherApplication.create({
        applicantRef,
        name: name.trim(),
        email: cleanEmail,
        phone: phone?.trim() || '',
        dateOfBirth: dateOfBirth || undefined,
        avatar: avatar || '',
        education: Array.isArray(education) ? education : [],
        subjects: Array.isArray(subjects) ? subjects : [],
        requestedSubjects: Array.isArray(requestedSubjects) ? requestedSubjects : [],
        experience: Array.isArray(experience) ? experience : [],
        bio: bio?.trim() || '',
        motivation: motivation?.trim() || '',
        status: 'pending',
      });
    }

    // Sync updated bio, education, experience to User model if user exists
    if (existingUser) {
      if (bio?.trim()) existingUser.bio = bio.trim();
      if (Array.isArray(education) && education.length > 0) existingUser.education = education;
      if (Array.isArray(experience) && experience.length > 0) existingUser.experience = experience;
      if (avatar) existingUser.avatar = avatar;
      await existingUser.save();
    }

    // Notify admin via email (non-blocking)
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';
    sendTeacherApplicationAdminNotification(
      application.name,
      application.email,
      `${adminUrl}/applications`
    ).catch(() => {});

    res.status(201).json({
      message: 'Teacher profile details & application submitted successfully!',
      applicationId: application._id,
      status: application.status,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/teacher-applications/my-status — Current user's application status
router.get('/my-status', async (req, res, next) => {
  try {
    // Try to get user from token
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.json({ application: null });
    }

    let userId;
    try {
      const { verifyAccessToken } = await import('../utils/tokens.js');
      const decoded = verifyAccessToken(header.slice(7));
      userId = decoded.userId;
    } catch {
      return res.json({ application: null });
    }

    const user = await User.findById(userId);
    if (!user) return res.json({ application: null });

    // Find by applicantRef or email
    const application = await TeacherApplication.findOne({
      $or: [
        { applicantRef: user._id },
        { email: user.email.toLowerCase() },
      ],
    }).sort({ createdAt: -1 });

    if (!application) return res.json({ application: null });

    res.json({
      application: {
        _id: application._id,
        status: application.status,
        name: application.name,
        email: application.email,
        rejectionReason: application.rejectionReason,
        reviewedAt: application.reviewedAt,
        createdAt: application.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/teacher-applications/stats — Admin stats ──────────────────────
router.get('/stats', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      TeacherApplication.countDocuments(),
      TeacherApplication.countDocuments({ status: 'pending' }),
      TeacherApplication.countDocuments({ status: 'approved' }),
      TeacherApplication.countDocuments({ status: 'rejected' }),
    ]);

    res.json({ total, pending, approved, rejected });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/teacher-applications — Admin list all applications ────────────
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, total] = await Promise.all([
      TeacherApplication.find(filter)
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TeacherApplication.countDocuments(filter),
    ]);

    res.json({
      applications,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/teacher-applications/:id/review — Approve or reject ───────────
router.put('/:id/review', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { action, rejectionReason, adminNotes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "approve" or "reject"' });
    }

    const application = await TeacherApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: `Application has already been ${application.status}` });
    }

    if (action === 'approve') {
      application.status = 'approved';
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
      if (adminNotes) application.adminNotes = adminNotes;
      await application.save();

      // Upgrade user role to teacher or create teacher account
      let user = await User.findOne({ email: application.email.toLowerCase() });
      if (user) {
        user.role = 'teacher';
        user.bio = user.bio || application.bio;
        if (!user.education?.length && application.education?.length) {
          user.education = application.education;
        }
        if (!user.experience?.length && application.experience?.length) {
          user.experience = application.experience;
        }
        if (!user.avatar && application.avatar) {
          user.avatar = application.avatar;
        }
        await user.save();
      }

      // Auto-create any requested subjects in database taxonomy
      if (Array.isArray(application.requestedSubjects) && application.requestedSubjects.length > 0) {
        let defaultClass = await Class.findOne();
        if (!defaultClass) {
          defaultClass = await Class.create({
            name: 'General',
            createdBy: req.user._id,
          });
        }

        for (const reqSub of application.requestedSubjects) {
          const cleanSub = reqSub.trim();
          if (!cleanSub) continue;

          const existingSub = await Subject.findOne({
            name: { $regex: new RegExp(`^${cleanSub}$`, 'i') },
          });

          if (!existingSub) {
            await Subject.create({
              name: cleanSub,
              classRef: defaultClass._id,
              createdBy: req.user._id,
            });
          }
        }
      }

      // Send approval email (non-blocking)
      const teacherPortalLink = process.env.TEACHER_PORTAL_URL || process.env.CLIENT_URL || 'http://localhost:5173';
      sendTeacherApprovalEmail(application.email, application.name, teacherPortalLink).catch(() => {});

      return res.json({
        message: `${application.name} has been approved as a teacher!`,
        application,
      });
    }

    if (action === 'reject') {
      if (!rejectionReason?.trim()) {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }

      application.status = 'rejected';
      application.rejectionReason = rejectionReason.trim();
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
      if (adminNotes) application.adminNotes = adminNotes;
      await application.save();

      // Send rejection email (non-blocking)
      sendTeacherRejectionEmail(application.email, application.name, rejectionReason.trim()).catch(() => {});

      return res.json({
        message: `Application from ${application.name} has been rejected.`,
        application,
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
