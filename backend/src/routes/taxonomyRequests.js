import { Router } from 'express';
import TaxonomyRequest from '../models/TaxonomyRequest.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  sendTaxonomyRequestAdminNotification,
  sendTaxonomyRequestStatusEmail,
} from '../utils/emailService.js';

const router = Router();

router.use(authenticate);

/** POST /api/taxonomy-requests — Teacher submits a new Class or Subject request */
router.post('/', requireRole('teacher'), async (req, res, next) => {
  try {
    const { type, name, classId } = req.body;

    if (!type || !['class', 'subject'].includes(type) || !name?.trim()) {
      return res.status(400).json({ message: 'Valid type (class/subject) and name are required' });
    }

    let classRef = null;
    let className = '';

    if (type === 'subject') {
      if (!classId) {
        return res.status(400).json({ message: 'classId is required when requesting a subject' });
      }
      const parentClass = await Class.findById(classId);
      if (!parentClass) {
        return res.status(404).json({ message: 'Selected Class not found' });
      }
      classRef = parentClass._id;
      className = parentClass.name;
    }

    const cleanName = name.trim();

    // Check if an active request already exists for this exact name & teacher
    const existing = await TaxonomyRequest.findOne({
      requestedBy: req.user._id,
      type,
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
      status: 'pending',
    });

    if (existing) {
      return res.status(409).json({ message: `You already have a pending ${type} request for "${cleanName}"` });
    }

    const request = await TaxonomyRequest.create({
      requestedBy: req.user._id,
      type,
      name: cleanName,
      classRef,
      className,
      status: 'pending',
    });

    // Notify admins via email (non-blocking)
    sendTaxonomyRequestAdminNotification({
      type,
      name: cleanName,
      teacherName: req.user.name,
      teacherEmail: req.user.email,
      className,
    }).catch(() => {});

    res.status(201).json({
      message: `Your request for ${type} "${cleanName}" has been submitted to Admins for review!`,
      request,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/taxonomy-requests/my-requests — Teacher views their request history & status */
router.get('/my-requests', requireRole('teacher'), async (req, res, next) => {
  try {
    const requests = await TaxonomyRequest.find({ requestedBy: req.user._id })
      .populate('classRef', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

/** GET /api/taxonomy-requests — Admin lists all requests across system */
router.get('/', requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;

    const requests = await TaxonomyRequest.find(filter)
      .populate('requestedBy', 'name email avatar')
      .populate('reviewedBy', 'name email')
      .populate('classRef', 'name')
      .sort({ createdAt: -1 });

    const stats = {
      total: await TaxonomyRequest.countDocuments(),
      pending: await TaxonomyRequest.countDocuments({ status: 'pending' }),
      approved: await TaxonomyRequest.countDocuments({ status: 'approved' }),
      rejected: await TaxonomyRequest.countDocuments({ status: 'rejected' }),
    };

    res.json({ requests, stats });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/taxonomy-requests/:id/review — Admin approves (with optional name standardisation) or rejects request */
router.put('/:id/review', requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { action, rejectionReason, adminSuggestion, approvedName, adminNote } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }

    const request = await TaxonomyRequest.findById(req.params.id).populate('requestedBy', 'name email');
    if (!request) {
      return res.status(404).json({ message: 'Taxonomy request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    let createdEntity = null;

    if (action === 'approve') {
      const originalRequestedName = request.name;
      const finalName = (approvedName && approvedName.trim()) ? approvedName.trim() : request.name;

      if (request.type === 'class') {
        let cls = await Class.findOne({ name: { $regex: new RegExp(`^${finalName}$`, 'i') } });
        if (!cls) {
          cls = await Class.create({ name: finalName, createdBy: req.user._id });
        }
        createdEntity = cls;
      } else if (request.type === 'subject') {
        let subject = await Subject.findOne({
          name: { $regex: new RegExp(`^${finalName}$`, 'i') },
          classRef: request.classRef,
        });
        if (!subject) {
          subject = await Subject.create({
            name: finalName,
            classRef: request.classRef,
            createdBy: req.user._id,
          });
        }
        createdEntity = subject;
      }

      request.originalName = originalRequestedName;
      request.approvedName = finalName;
      request.name = finalName;
      request.adminNote = adminNote ? adminNote.trim() : '';
      request.status = 'approved';
      request.reviewedBy = req.user._id;
      await request.save();

      // Send approval confirmation email to teacher (non-blocking)
      sendTaxonomyRequestStatusEmail({
        teacherEmail: request.requestedBy.email,
        teacherName: request.requestedBy.name,
        type: request.type,
        name: finalName,
        originalName: originalRequestedName,
        approvedName: finalName,
        adminNote: request.adminNote,
        status: 'approved',
      }).catch(() => {});

      return res.json({
        message: `Request approved and ${request.type} "${finalName}" added to database taxonomy!`,
        request,
        createdEntity,
      });
    } else {
      // Reject action
      if (!rejectionReason?.trim()) {
        return res.status(400).json({ message: 'Rejection reason is required when rejecting a request' });
      }

      request.status = 'rejected';
      request.rejectionReason = rejectionReason.trim();
      request.adminSuggestion = adminSuggestion?.trim() || '';
      request.reviewedBy = req.user._id;
      await request.save();

      // Send rejection notification email to teacher (non-blocking)
      sendTaxonomyRequestStatusEmail({
        teacherEmail: request.requestedBy.email,
        teacherName: request.requestedBy.name,
        type: request.type,
        name: request.name,
        status: 'rejected',
        rejectionReason: request.rejectionReason,
        adminSuggestion: request.adminSuggestion,
      }).catch(() => {});

      return res.json({
        message: `Request rejected and teacher notified via email.`,
        request,
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
