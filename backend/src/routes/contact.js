import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactEmail, sendPrivacyInquiryNotification } from '../utils/emailService.js';
import { sanitizeString } from '../utils/sanitize.js';

const router = Router();

/**
 * POST /api/contact
 * Public — send a contact or privacy/grievance message via Resend
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('inquiryType').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, message, isTeacher, inquiryType } = req.body;

      if (inquiryType === 'privacy' || inquiryType === 'grievance') {
        await sendPrivacyInquiryNotification({
          name: sanitizeString(name),
          email: email.toLowerCase(),
          inquiryType,
          message: sanitizeString(message),
        });
      } else {
        await sendContactEmail({
          name: sanitizeString(name),
          email: email.toLowerCase(),
          message: sanitizeString(message),
          isTeacher: Boolean(isTeacher),
        });
      }

      res.json({ message: 'Thank you — your message has been sent successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

