import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Class from '../models/Class.js';
import OtpVerification from '../models/OtpVerification.js';
import { sendOtpEmail } from '../utils/emailService.js';
import {
  hashPassword,
  comparePassword,
  hashToken,
  issueTokens,
  clearRefreshCookie,
} from '../utils/authHelpers.js';
import { verifyRefreshToken } from '../utils/tokens.js';

const router = Router();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
          if (!user) {
            return done(null, false, {
              message: 'ROLE_REQUIRED',
              profile: {
                email: profile.emails[0].value,
                name: profile.displayName,
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value,
              },
            });
          }
          if (!user.googleId) {
            user.googleId = profile.id;
            user.avatar = profile.photos?.[0]?.value;
            await user.save();
          }
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return false;
  }
  return true;
}

router.get('/me', async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.json({ user: null });
    }
    const { verifyAccessToken } = await import('../utils/tokens.js');
    const decoded = verifyAccessToken(header.slice(7));
    const user = await User.findById(decoded.userId)
      .select('-passwordHash -refreshTokenHash')
      .populate('classRef', 'name');
    res.json({ user: user || null });
  } catch {
    res.json({ user: null });
  }
});

router.post(
  '/send-otp',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { name, email, role, classId, className } = req.body;
      const cleanEmail = email.toLowerCase();

      const existing = await User.findOne({ email: cleanEmail });
      if (existing) return res.status(409).json({ message: 'Email already registered' });

      let resolvedClassId = classId;
      if (role === 'student') {
        if (!resolvedClassId && className?.trim()) {
          const cls = await Class.findOne({
            name: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
          });
          if (cls) resolvedClassId = cls._id;
        }
        if (resolvedClassId) {
          const cls = await Class.findById(resolvedClassId);
          if (!cls) resolvedClassId = undefined;
        }
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP
      await OtpVerification.deleteMany({ email: cleanEmail });
      await OtpVerification.create({
        email: cleanEmail,
        otp,
      });

      // Send OTP Email
      await sendOtpEmail(cleanEmail, otp, name);

      res.json({ message: 'Verification code sent to your email' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('6-digit OTP code required'),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { name, email, password, role, classId, className, otp } = req.body;
      const cleanEmail = email.toLowerCase();

      const existing = await User.findOne({ email: cleanEmail });
      if (existing) return res.status(409).json({ message: 'Email already registered' });

      // Verify OTP
      const otpRecord = await OtpVerification.findOne({ email: cleanEmail, otp });
      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired verification code' });
      }

      let resolvedClassId = classId;
      if (role === 'student') {
        if (!resolvedClassId && className?.trim()) {
          const cls = await Class.findOne({
            name: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
          });
          if (cls) resolvedClassId = cls._id;
        }
        if (resolvedClassId) {
          const cls = await Class.findById(resolvedClassId);
          if (!cls) resolvedClassId = undefined;
        }
      }

      const passwordHash = await hashPassword(password);
      const user = await User.create({
        name,
        email: cleanEmail,
        passwordHash,
        role,
        classRef: role === 'student' ? resolvedClassId : undefined,
      });

      // Delete used OTP
      await OtpVerification.deleteMany({ email: cleanEmail });

      const tokens = await issueTokens(user, res);
      res.status(201).json(tokens);
    } catch (err) {
      next(err);
    }
  }
);


router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user?.passwordHash) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
      const tokens = await issueTokens(user, res);
      res.json(tokens);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'Refresh token missing' });

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.refreshTokenHash !== hashToken(token)) {
      // Token mismatch — security ke liye hash clear karo (reuse attempt)
      await User.findByIdAndUpdate(decoded.userId, { refreshTokenHash: null });
      return res.status(401).json({ message: 'Refresh token invalid' });
    }

    const tokens = await issueTokens(user, res);
    res.json({ accessToken: tokens.accessToken, user: tokens.user });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await User.findByIdAndUpdate(decoded.userId, { refreshTokenHash: null });
      } catch {
        /* ignore */
      }
    }
    clearRefreshCookie(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: 'Google OAuth not configured' });
  }
  const role = req.query.role;
  const state = role ? Buffer.from(JSON.stringify({ role })).toString('base64') : '';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
  }
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err) return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
      if (!user) {
        if (info?.message === 'ROLE_REQUIRED' && info.profile) {
          const q = new URLSearchParams({
            oauth: '1',
            email: info.profile.email,
            name: info.profile.name || '',
            googleId: info.profile.googleId,
          });
          return res.redirect(`${process.env.CLIENT_URL}/signup?${q}`);
        }
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
      }
      const mockRes = {
        cookie: () => {},
        clearCookie: () => {},
      };
      const tokens = await issueTokens(user, {
        cookie: (name, val, opts) => res.cookie(name, val, opts),
        clearCookie: (name, opts) => res.clearCookie(name, opts),
      });
      res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${tokens.accessToken}`);
    } catch {
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
    }
  })(req, res, next);
});

router.post('/oauth-register', async (req, res, next) => {
  try {
    const { name, email, role, classId, className, googleId, avatar } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    let resolvedClassId = classId;
    if (role === 'student') {
      if (!resolvedClassId && className?.trim()) {
        const cls = await Class.findOne({
          name: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
        });
        if (cls) resolvedClassId = cls._id;
      }
      if (resolvedClassId) {
        const cls = await Class.findById(resolvedClassId);
        if (!cls) resolvedClassId = undefined;
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role,
      classRef: role === 'student' ? resolvedClassId : undefined,
      googleId,
      avatar,
    });
    const tokens = await issueTokens(user, res);
    res.status(201).json(tokens);
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/forgot-password — Send OTP code for password reset */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Return 200 for security, avoid leaking user existence
      return res.json({ message: 'If an account exists, a reset verification code has been sent.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact Super Admin.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpVerification.deleteMany({ email: cleanEmail });
    await OtpVerification.create({
      email: cleanEmail,
      otp,
    });

    await sendOtpEmail(cleanEmail, otp, user.name);

    res.json({ message: 'Password reset code sent to your email.' });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/reset-password — Verify OTP and reset password */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const otpRecord = await OtpVerification.findOne({ email: cleanEmail, otp: otp.trim() });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await OtpVerification.deleteMany({ email: cleanEmail });

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    next(err);
  }
});

export default router;
