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

export function setAccessCookie(res, token, portal = null) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 2 * 60 * 1000, // 2 minutes matching 2m access token expiration
    path: '/',
  };

  res.cookie('accessToken', token, cookieOptions);

  if (portal === 'admin') {
    res.cookie('adminAccessToken', token, cookieOptions);
  } else if (portal === 'student') {
    res.cookie('studentAccessToken', token, cookieOptions);
  }
}

export function setRefreshCookie(res, token, portal = null) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days matching 30d refresh token expiration
    path: '/',
  };

  res.cookie('refreshToken', token, cookieOptions);

  if (portal === 'admin') {
    res.cookie('adminRefreshToken', token, cookieOptions);
  } else if (portal === 'student') {
    res.cookie('studentRefreshToken', token, cookieOptions);
  }
}

export async function issueTokens(user, res, portal = null) {
  const userPortal = portal || (['admin', 'super_admin'].includes(user.role) ? 'admin' : 'student');
  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const newHash = hashToken(refreshToken);

  // Preserve previousRefreshTokenHash to prevent race-condition logouts during multi-tab or concurrent refreshes
  await User.findByIdAndUpdate(user._id, {
    previousRefreshTokenHash: user.refreshTokenHash || null,
    refreshTokenHash: newHash,
  });

  setAccessCookie(res, accessToken, userPortal);
  setRefreshCookie(res, refreshToken, userPortal);
  const safeUser = await User.findById(user._id).select('-passwordHash -refreshTokenHash -previousRefreshTokenHash');
  return { user: safeUser, accessToken };
}

export function clearAuthCookies(res, portal = null) {
  const opts = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  if (!portal || portal === 'admin') {
    res.clearCookie('adminAccessToken', opts);
    res.clearCookie('adminRefreshToken', opts);
  }
  if (!portal || portal === 'student') {
    res.clearCookie('studentAccessToken', opts);
    res.clearCookie('studentRefreshToken', opts);
  }
  res.clearCookie('accessToken', opts);
  res.clearCookie('refreshToken', opts);
}

export const clearRefreshCookie = clearAuthCookies;

