import { verifyAccessToken, verifyRefreshToken } from '../utils/tokens.js';
import User from '../models/User.js';
import { hashToken, issueTokens, clearAuthCookies } from '../utils/authHelpers.js';

export async function authenticate(req, res, next) {
  try {
    const portal = req.headers['x-auth-portal'];
    let token;
    const header = req.headers.authorization;

    // Prioritize Authorization header over cookies
    if (header?.startsWith('Bearer ')) {
      token = header.slice(7).trim();
    } else {
      if (portal === 'admin' && req.cookies?.adminAccessToken) {
        token = req.cookies.adminAccessToken;
      } else if (portal === 'student' && req.cookies?.studentAccessToken) {
        token = req.cookies.studentAccessToken;
      } else {
        token = req.cookies?.accessToken || req.cookies?.adminAccessToken || req.cookies?.studentAccessToken;
      }
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokenHash -previousRefreshTokenHash');
        if (user) {
          if (user.isActive === false) {
            return res.status(403).json({ message: 'Account deactivated. Please contact Super Admin.' });
          }
          const isAdmin = ['admin', 'super_admin'].includes(user.role);
          if (portal === 'admin' && !isAdmin) {
            return res.status(401).json({ message: 'Invalid token for admin portal' });
          }
          if (portal === 'student' && isAdmin) {
            return res.status(401).json({ message: 'Invalid token for student portal' });
          }
          req.user = user;
          return next();
        }
      } catch {
        // Access token expired or invalid, fall through to refresh token attempt
      }
    }

    // Fallback: Check if valid refresh token cookie exists to automatically refresh
    const refreshToken = portal === 'admin'
      ? (req.cookies?.adminRefreshToken || req.cookies?.refreshToken)
      : portal === 'student'
      ? (req.cookies?.studentRefreshToken || req.cookies?.refreshToken)
      : (req.cookies?.adminRefreshToken || req.cookies?.studentRefreshToken || req.cookies?.refreshToken);

    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.userId);
        const hashed = hashToken(refreshToken);
        const matchesHash = user && (user.refreshTokenHash === hashed || user.previousRefreshTokenHash === hashed);
        if (user && matchesHash) {
          if (user.isActive === false) {
            return res.status(403).json({ message: 'Account deactivated. Please contact Super Admin.' });
          }
          const isAdmin = ['admin', 'super_admin'].includes(user.role);
          if (portal === 'admin' && !isAdmin) {
            return res.status(401).json({ message: 'Invalid refresh token for admin portal' });
          }
          if (portal === 'student' && isAdmin) {
            return res.status(401).json({ message: 'Invalid refresh token for student portal' });
          }

          await issueTokens(user, res, portal);
          const safeUser = await User.findById(user._id).select('-passwordHash -refreshTokenHash -previousRefreshTokenHash');
          req.user = safeUser;
          return next();
        }
      } catch {
        clearAuthCookies(res, portal);
      }
    }

    return res.status(401).json({ message: 'Invalid or expired token' });
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    // super_admin has access to all admin routes
    const isSuperAdmin = req.user.role === 'super_admin';
    const isAllowed = roles.includes(req.user.role) || (isSuperAdmin && roles.includes('admin'));

    if (!isAllowed) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.user.isActive === false) {
      return res.status(403).json({ message: 'Account deactivated. Please contact Super Admin.' });
    }

    next();
  };
}
