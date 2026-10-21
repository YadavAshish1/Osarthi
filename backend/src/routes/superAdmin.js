import { Router } from 'express';
import multer from 'multer';
import User from '../models/User.js';
import Testimonial from '../models/Testimonial.js';
import HomeSettings, { DEFAULT_BANNERS } from '../models/HomeSettings.js';
import TopTeacherCard from '../models/TopTeacherCard.js';
import TeacherApplication from '../models/TeacherApplication.js';
import SupportTicket from '../models/SupportTicket.js';
import Content from '../models/Content.js';
import { uploadMedia } from '../services/storage.js';
import { hashPassword } from '../utils/authHelpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { escapeRegex } from '../utils/sanitize.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

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

/** GET /api/superadmin/dashboard-stats — Aggregated overview for admin dashboard */
router.get('/dashboard-stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalInsights,
      pendingApplications,
      openTickets,
      homeSettings,
      activeTeacherCards,
      activeTestimonials,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
      Content.countDocuments({ status: 'published' }).catch(() => 0),
      TeacherApplication.countDocuments({ status: 'pending' }).catch(() => 0),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }).catch(() => 0),
      HomeSettings.findOne().catch(() => null),
      TopTeacherCard.countDocuments({ active: true }).catch(() => 0),
      Testimonial.countDocuments({ isActive: true }).catch(() => 0),
    ]);

    res.json({
      users: {
        total: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        admins: totalAdmins,
      },
      insights: totalInsights,
      pendingApplications,
      openTickets,
      homeStats: homeSettings?.stats || {
        learners: '10,000+',
        insights: '250+',
        mentors: '50+',
        subjects: '20+',
      },
      bannersCount: homeSettings?.banners?.length || 2,
      activeTeacherCards,
      activeTestimonials,
    });
  } catch (err) {
    next(err);
  }
});

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
      const searchRegex = new RegExp(escapeRegex(q.trim()), 'i');
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

// ─── Testimonials CRUD ────────────────────────────────────────────────────────

/** GET /api/superadmin/testimonials — List all testimonials */
router.get('/testimonials', async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    next(err);
  }
});

/** POST /api/superadmin/testimonials — Create new testimonial */
router.post('/testimonials', async (req, res, next) => {
  try {
    const { name, role, avatar, review, rating, isActive, order } = req.body;
    if (!name || !review) {
      return res.status(400).json({ message: 'name and review are required' });
    }
    const t = await Testimonial.create({ name, role, avatar, review, rating, isActive, order });
    res.status(201).json(t);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/superadmin/testimonials/:id — Update testimonial */
router.put('/testimonials/:id', async (req, res, next) => {
  try {
    const { name, role, avatar, review, rating, isActive, order } = req.body;
    const t = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { name, role, avatar, review, rating, isActive, order },
      { new: true, runValidators: true }
    );
    if (!t) return res.status(404).json({ message: 'Testimonial not found' });
    res.json(t);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/superadmin/testimonials/:id — Delete testimonial */
router.delete('/testimonials/:id', async (req, res, next) => {
  try {
    const t = await Testimonial.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ message: 'Testimonial not found' });
    res.json({ message: 'Testimonial deleted' });
  } catch (err) {
    next(err);
  }
});

/** POST /api/superadmin/testimonials/upload — Upload student avatar */
router.post('/testimonials/upload', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const result = await uploadMedia(req.file, { userId: req.user._id.toString(), folder: 'testimonials' });
    res.json({ url: result.url });
  } catch (err) {
    next(err);
  }
});

/** Seed authentic Indian student testimonials if collection is empty */
export async function seedDefaultTestimonials() {
  try {
    const count = await Testimonial.countDocuments();
    if (count === 0) {
      const defaultTestimonials = [
        {
          name: 'Aarav Sharma',
          role: 'Class 10 Student, Delhi',
          avatar: 'https://res.cloudinary.com/dve3lbolq/image/upload/v1791907115/medhashine/students/aarav-sharma.jpg',
          review: 'Medhashine completely changed how I study for board exams. The insights written by real mentors actually explain the core logic — not just rote formulas. Scored 94% in Science this year!',
          rating: 5,
          isActive: true,
          order: 0,
        },
        {
          name: 'Ananya Iyer',
          role: 'Grade 12 Student, Bengaluru',
          avatar: 'https://res.cloudinary.com/dve3lbolq/image/upload/v1791907115/medhashine/students/ananya-iyer.jpg',
          review: 'The Biology and Chemistry breakdowns helped me connect textbook theory with deep conceptual clarity. Having access to genuine subject scholars solved all my doubts.',
          rating: 5,
          isActive: true,
          order: 1,
        },
        {
          name: 'Rohan Verma',
          role: 'Class 11 Student, Kota',
          avatar: 'https://res.cloudinary.com/dve3lbolq/image/upload/v1791907116/medhashine/students/rohan-verma.jpg',
          review: 'Finally found a platform where teachers care about building intuition. The calculus notes and physics mechanics breakdowns saved my foundation for competitive exams.',
          rating: 5,
          isActive: true,
          order: 2,
        },
        {
          name: 'Pooja Deshmukh',
          role: 'Class 10 Student, Pune',
          avatar: 'https://res.cloudinary.com/dve3lbolq/image/upload/v1791907117/medhashine/students/pooja-deshmukh.jpg',
          review: 'The daily reading room is like having an intellectual elder sibling who explains concepts beautifully. I look forward to reading a new insight every morning before school.',
          rating: 5,
          isActive: true,
          order: 3,
        },
        {
          name: 'Aditya Patel',
          role: 'Grade 12 Student, Ahmedabad',
          avatar: 'https://res.cloudinary.com/dve3lbolq/image/upload/v1791907118/medhashine/students/aditya-patel.jpg',
          review: 'I was struggling with Chemistry and literature analysis and couldn\'t afford expensive coaching. Medhashine\'s free insights are coaching institute quality. Absolutely recommend it.',
          rating: 5,
          isActive: true,
          order: 4,
        },
      ];
      await Testimonial.insertMany(defaultTestimonials);
      console.log('[Testimonials] Seeded 5 authentic student testimonials');
    }
  } catch (err) {
    console.error('[Testimonials] Failed to seed testimonials:', err.message);
  }
}

// ─── Home Settings (Stats) ────────────────────────────────────────────────────

/** GET /api/superadmin/home-settings — Get home page settings */
router.get('/home-settings', async (req, res, next) => {
  try {
    let settings = await HomeSettings.findOne();
    if (!settings) {
      settings = await HomeSettings.create({ banners: DEFAULT_BANNERS });
    } else if (!settings.banners || settings.banners.length === 0) {
      settings.banners = DEFAULT_BANNERS;
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/superadmin/home-settings — Update stats, featured insights & banners */
router.put('/home-settings', async (req, res, next) => {
  try {
    const { stats, featuredInsightIds, banners } = req.body;
    let settings = await HomeSettings.findOne();
    if (!settings) {
      settings = new HomeSettings();
    }
    if (stats !== undefined) {
      settings.stats = {
        learners: stats.learners !== undefined ? String(stats.learners) : (settings.stats?.learners || '10,000+'),
        insights: stats.insights !== undefined ? String(stats.insights) : (settings.stats?.insights || '250+'),
        mentors: stats.mentors !== undefined ? String(stats.mentors) : (settings.stats?.mentors || '50+'),
        subjects: stats.subjects !== undefined ? String(stats.subjects) : (settings.stats?.subjects || '20+'),
      };
    }
    if (featuredInsightIds !== undefined) settings.featuredInsightIds = featuredInsightIds;
    if (banners !== undefined) settings.banners = banners;
    await settings.save();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

/** POST /api/superadmin/home-settings/upload — Upload banner background image */
router.post('/home-settings/upload', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const result = await uploadMedia(req.file, { userId: req.user._id.toString(), folder: 'banners' });
    res.json({ url: result.url });
  } catch (err) {
    next(err);
  }
});

// ─── Top Teacher Cards (Educator Spotlight) ──────────────────────────────────

/** Seed default educator cards if collection is empty */
export async function seedTopTeacherCards() {
  try {
    const count = await TopTeacherCard.countDocuments();
    if (count === 0) {
      const defaultCards = [
        {
          headerText: 'Hindi Literature Mentor',
          name: 'Dr. Ramesh Yaduvanshi',
          image: 'https://res.cloudinary.com/dve3lbolq/image/upload/v1791907110/medhashine/teachers/ramesh-yaduvanshi.png',
          themeColor: '#A84C32',
          ctaUrl: '/teachers/6a1ecc54f03ba84730cfb054-dr-ramesh-yaduvanshi',
          metricCount: '115 Insights',
          verifiedText: 'Verified Mentor',
          order: 0,
          active: true,
        },
        {
          headerText: 'Science & Chemistry Mentor',
          name: 'A.K Singh',
          image: 'https://res.cloudinary.com/dve3lbolq/image/upload/v1791907111/medhashine/teachers/ak-singh.png',
          themeColor: '#2B3A67',
          ctaUrl: '/teachers/6a9834bdfb53aa95cffb5225-ak-singh',
          metricCount: '5 Insights',
          verifiedText: 'Verified Mentor',
          order: 1,
          active: true,
        },
        {
          headerText: 'Mathematics Mentor',
          name: 'Ashish Yadav',
          image: 'https://res.cloudinary.com/dve3lbolq/image/upload/v1791907112/medhashine/teachers/ashish-yadav.png',
          themeColor: '#2E7D32',
          ctaUrl: '/teachers/6a74cfd3ffed93e33170c81e-ashish-yadav',
          metricCount: 'Lead Educator',
          verifiedText: 'Verified Mentor',
          order: 2,
          active: true,
        },
        {
          headerText: 'Academic Scholar',
          name: 'Dr Satyendra',
          image: 'https://res.cloudinary.com/dve3lbolq/image/upload/v1791907113/medhashine/teachers/dr-satyendra.png',
          themeColor: '#D97706',
          ctaUrl: '/teachers/6abbe076200af705bade595d-dr-satyendra',
          metricCount: 'Senior Mentor',
          verifiedText: 'Verified Mentor',
          order: 3,
          active: true,
        },
      ];
      await TopTeacherCard.insertMany(defaultCards);
      console.log('[TopTeacherCard] Seeded 4 default educator cards');
    }
  } catch (err) {
    console.error('[TopTeacherCard] Failed to seed cards:', err.message);
  }
}

/** GET /api/superadmin/top-teachers — List all educator cards */
router.get('/top-teachers', async (_req, res, next) => {
  try {
    const cards = await TopTeacherCard.find().sort({ order: 1, createdAt: 1 });
    res.json(cards);
  } catch (err) {
    next(err);
  }
});

/** POST /api/superadmin/top-teachers/upload — Upload teacher image */
router.post('/top-teachers/upload', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const result = await uploadMedia(req.file, { userId: req.user._id.toString(), folder: 'top-teachers' });
    res.json({ url: result.url });
  } catch (err) {
    next(err);
  }
});

/** POST /api/superadmin/top-teachers — Create a new educator card */
router.post('/top-teachers', async (req, res, next) => {
  try {
    const { headerText, name, image, themeColor, ctaUrl, metricCount, verifiedText, active, order } = req.body;
    if (!name || !image) {
      return res.status(400).json({ message: 'Teacher name and image are required' });
    }
    const card = await TopTeacherCard.create({
      headerText: headerText || 'Academic Mentor',
      name: name.trim(),
      image: image.trim(),
      themeColor: themeColor || '#A84C32',
      ctaUrl: ctaUrl?.trim() || '',
      metricCount: metricCount || 'Verified Mentor',
      verifiedText: verifiedText || 'Verified Mentor',
      active: active !== undefined ? active : true,
      order: order !== undefined ? Number(order) : 0,
    });
    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/superadmin/top-teachers/:id — Update an educator card */
router.put('/top-teachers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const card = await TopTeacherCard.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    res.json(card);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/superadmin/top-teachers/:id — Delete an educator card */
router.delete('/top-teachers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const card = await TopTeacherCard.findByIdAndDelete(id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    res.json({ message: 'Card deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
