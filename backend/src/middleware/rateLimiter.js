import rateLimit from 'express-rate-limit';

/**
 * Authentication Route Rate Limiter
 * 100 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Public Form Submission Rate Limiter (Contact, Support Tickets)
 * 10 submissions per 15 minutes per IP to prevent spam
 */
export const formSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Comment Submission Rate Limiter
 * 30 comments per 15 minutes per IP
 */
export const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many comments. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Teacher Application Submission Rate Limiter
 * 5 applications per 15 minutes per IP to prevent duplicate spams
 */
export const applicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many application attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
