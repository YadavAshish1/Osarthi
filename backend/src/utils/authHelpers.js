import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { signAccessToken, signRefreshToken } from './tokens.js';

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function setAuthCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };

  // 1. Access Token cookie (2 hours)
  res.cookie('accessToken', accessToken, {
    ...cookieOpts,
    maxAge: 2 * 60 * 60 * 1000,
  });

  // 2. Refresh Token cookie (30 days)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOpts,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

export async function issueTokens(user, res) {
  const payload = { userId: user._id.toString(), role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const newHash = hashToken(refreshToken);

  // Use atomic update to avoid stale-document overwrite issues
  await User.findByIdAndUpdate(user._id, { refreshTokenHash: newHash });

  if (res && typeof res.cookie === 'function') {
    setAuthCookies(res, accessToken, refreshToken);
  }

  const safeUser = await User.findById(user._id).select('-passwordHash -refreshTokenHash');
  return { user: safeUser };
}
