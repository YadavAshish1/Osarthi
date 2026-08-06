import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokenHash');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account deactivated. Please contact Super Admin.' });
    }
    req.user = user;
    next();
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
