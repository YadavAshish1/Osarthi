import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactEmail } from '../utils/emailService.js';

const router = Router();

/**
 * POST /api/contact
 * Public — send a contact message via Resend email to ADMIN_EMAIL
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, message, isTeacher } = req.body;

      await sendContactEmail({
        name,
        email: email.toLowerCase(),
        message,
        isTeacher: Boolean(isTeacher),
      });

      res.json({ message: 'Thank you — your message has been sent successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
