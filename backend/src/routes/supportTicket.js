import { Router } from 'express';
import SupportTicket from '../models/SupportTicket.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Helper to generate unique Ticket ID e.g. MS-849201
function generateTicketId() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `MS-${num}`;
}

// ─── PUBLIC: Submit Support Ticket ──────────────────────────────────────────
router.post('/tickets', async (req, res) => {
  try {
    const { name, email, phone, role, category, priority, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required.' });
    }

    let ticketId = generateTicketId();
    // Ensure uniqueness
    let existing = await SupportTicket.findOne({ ticketId });
    while (existing) {
      ticketId = generateTicketId();
      existing = await SupportTicket.findOne({ ticketId });
    }

    const ticket = await SupportTicket.create({
      ticketId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      role: role || 'student',
      category: category || 'technical',
      priority: priority || 'medium',
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
    });

    const adminDeepLink = `http://localhost:5173/support-tickets?id=${ticket.ticketId}`;
    console.log(`\n=============================================================`);
    console.log(`[SUPPORT TICKET NOTIFICATION EMAIL]`);
    console.log(`New Ticket Submitted: #${ticket.ticketId}`);
    console.log(`From: ${ticket.name} <${ticket.email}> | Phone: ${ticket.phone || 'N/A'} (${ticket.role})`);
    console.log(`Category: ${ticket.category} | Priority: ${ticket.priority}`);
    console.log(`Subject: ${ticket.subject}`);
    console.log(`Admin Governance Deep Link: ${adminDeepLink}`);
    console.log(`=============================================================\n`);

    res.status(201).json({
      ok: true,
      ticketId: ticket.ticketId,
      message: 'Support ticket created successfully! Our team will respond shortly.',
      ticket,
      adminDeepLink,
    });
  } catch (err) {
    console.error('Error creating support ticket:', err);
    res.status(500).json({ message: 'Server error while creating support ticket' });
  }
});

// ─── ADMIN: List All Support Tickets with Overview Stats & Filters ─────────
router.get('/admin/tickets', authenticate, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { status, category, priority, role, search } = req.query;

    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;
    if (role && role !== 'all') filter.role = role;

    if (search) {
      const q = search.trim();
      filter.$or = [
        { ticketId: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } },
      ];
    }

    const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 });

    // Calculate aggregated overview counts
    const totalCount = await SupportTicket.countDocuments();
    const openCount = await SupportTicket.countDocuments({ status: 'open' });
    const inProgressCount = await SupportTicket.countDocuments({ status: 'in_progress' });
    const resolvedCount = await SupportTicket.countDocuments({ status: 'resolved' });
    const closedCount = await SupportTicket.countDocuments({ status: 'closed' });

    res.json({
      ok: true,
      tickets,
      counts: {
        total: totalCount,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
      },
    });
  } catch (err) {
    console.error('Error fetching support tickets for admin:', err);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// ─── ADMIN: Get Single Support Ticket ──────────────────────────────────────
router.get('/admin/tickets/:ticketId', authenticate, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json({ ok: true, ticket });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch ticket' });
  }
});

// ─── ADMIN: Update Ticket Status, Response Message & Add Admin Notes ──────
router.put('/admin/tickets/:ticketId/status', authenticate, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { status, responseMessage, note, priority } = req.body;
    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const oldStatus = ticket.status;

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (responseMessage !== undefined) ticket.responseMessage = responseMessage.trim();

    if (note && note.trim()) {
      ticket.adminNotes.push({
        note: note.trim(),
        addedBy: req.user?.name || 'Admin',
        addedAt: new Date(),
      });
    }

    await ticket.save();

    console.log(`\n=============================================================`);
    console.log(`[SUPPORT TICKET STATUS UPDATE EMAIL]`);
    console.log(`Ticket #${ticket.ticketId} updated by Admin ${req.user?.name || ''}`);
    console.log(`Status changed: ${oldStatus} -> ${ticket.status}`);
    console.log(`Recipient: ${ticket.name} <${ticket.email}>`);
    if (ticket.responseMessage) {
      console.log(`Official Admin Response: "${ticket.responseMessage}"`);
    }
    console.log(`=============================================================\n`);

    res.json({
      ok: true,
      message: `Ticket #${ticket.ticketId} status updated to ${ticket.status}`,
      ticket,
    });
  } catch (err) {
    console.error('Error updating ticket status:', err);
    res.status(500).json({ message: 'Failed to update ticket status' });
  }
});

export default router;
