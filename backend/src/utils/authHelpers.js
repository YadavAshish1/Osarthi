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

export function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function issueTokens(user, res) {
  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const newHash = hashToken(refreshToken);

  // Use atomic update to avoid stale-document overwrite issues
  await User.findByIdAndUpdate(user._id, { refreshTokenHash: newHash });

  setRefreshCookie(res, refreshToken);
  const safeUser = await User.findById(user._id).select('-passwordHash -refreshTokenHash');
  return { accessToken, user: safeUser };
}

export function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', { path: '/' });
}
