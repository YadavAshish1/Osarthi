import { Router } from 'express';
import User from '../models/User.js';
import { hashPassword } from '../utils/authHelpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Auto-seed Super Admin user on server startup if none exists
export async function seedSuperAdmin() {
  try {
    const existing = await User.findOne({ role: 'super_admin' });
    if (!existing) {
      const email = process.env.SUPERADMIN_EMAIL || 'superadmin@medhashine.com';
      const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@12345';
      const passwordHash = await hashPassword(password);

      await User.create({
        name: 'Super Admin',
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'super_admin',
        isActive: true,
      });
      console.log(`[SuperAdmin] Seeded default super admin account: ${email}`);
    }
  } catch (err) {
    console.error('[SuperAdmin] Failed to seed super admin:', err.message);
  }
}

// Endpoints require authentication & admin or super_admin role
router.use(authenticate);
router.use(requireRole('admin', 'super_admin'));

/** GET /api/superadmin/users — List users across system */
router.get('/users', async (req, res, next) => {
  try {
    const { role, q, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Regular admins cannot see super_admin accounts
    if (req.user.role === 'admin') {
      filter.role = { $ne: 'super_admin' };
      if (role && role !== 'all' && role !== 'super_admin') {
        filter.role = role;
      }
    } else if (role && role !== 'all') {
      filter.role = role;
    }

    if (q?.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/superadmin/users — Create new user directly */
router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (!['student', 'teacher', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Regular admin cannot create a super_admin
    if (req.user.role === 'admin' && role === 'super_admin') {
      return res.status(403).json({ message: 'Only Super Admins can create Super Admin accounts' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role,
      isActive: true,
    });

    res.status(201).json({
      message: `User ${newUser.name} created successfully as ${newUser.role}`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/superadmin/users/:id/toggle-status — Activate or Deactivate account */
router.put('/users/:id/toggle-status', async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    if (req.user.role === 'admin' && targetUser.role === 'super_admin') {
      return res.status(403).json({ message: 'Admins cannot deactivate a Super Admin account' });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    res.json({
      message: `Account for ${targetUser.name} is now ${targetUser.isActive ? 'Active' : 'Deactivated'}`,
      isActive: targetUser.isActive,
    });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/superadmin/users/:id — Delete user account */
router.delete('/users/:id', async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    if (req.user.role === 'admin' && targetUser.role === 'super_admin') {
      return res.status(403).json({ message: 'Admins cannot delete a Super Admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: `User ${targetUser.name} (${targetUser.email}) has been permanently deleted` });
  } catch (err) {
    next(err);
  }
});

export default router;
