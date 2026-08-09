import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import AdminHeader from '../components/AdminHeader';
import {
  LifeBuoy, Search, Filter, Clock, CheckCircle2,
  AlertTriangle, XCircle, ArrowUpRight, MessageSquare,
  ShieldCheck, User, Mail, Phone, Send, ChevronRight, X,
  FileText, Sparkles, RefreshCw, Lock, Eye
} from 'lucide-react';

export default function SupportTickets() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket Drawer / Inspector State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [responseMsg, setResponseMsg] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [updating, setUpdating] = useState(false);

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const { data } = await api.get(`/support/admin/tickets?${params.toString()}`);
      if (data?.tickets) setTickets(data.tickets);
      if (data?.counts) setCounts(data.counts);

      // If deep link query param `?id=MS-XXXXXX` is present in URL, auto open that ticket inspector
      const linkId = searchParams.get('id');
      if (linkId && data?.tickets) {
        const matched = data.tickets.find((t) => t.ticketId === linkId);
        if (matched) {
          setSelectedTicket(matched);
          setNewStatus(matched.status);
          setNewPriority(matched.priority);
          setResponseMsg(matched.responseMessage || '');
        }
      }
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to load support tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, roleFilter, searchQuery, searchParams, addToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openTicketDrawer = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setNewPriority(ticket.priority);
    setResponseMsg(ticket.responseMessage || '');
    setAdminNoteInput('');
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdating(true);
    try {
      const payload = {
        status: newStatus,
        priority: newPriority,
        responseMessage: responseMsg,
        note: adminNoteInput,
      };

      const { data } = await api.put(`/support/admin/tickets/${selectedTicket.ticketId}/status`, payload);
      addToast(data.message || 'Ticket status updated successfully!', 'success');
      setSelectedTicket(data.ticket);
      setAdminNoteInput('');
      fetchTickets();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to update ticket', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const statusBadge = (st) => {
    const map = {
      open: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      closed: 'bg-slate-700/50 text-slate-400 border-slate-600',
    };
    return map[st] || 'bg-slate-700 text-slate-400 border-slate-600';
  };

  const priorityBadge = (pr) => {
    const map = {
      urgent: 'bg-red-600/20 text-red-400 border-red-600/40 font-extrabold',
      high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      medium: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      low: 'bg-slate-700/40 text-slate-400 border-slate-600',
    };
    return map[pr] || 'bg-slate-700 text-slate-400 border-slate-600';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-slide-in ${
              t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            } text-white`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <AdminHeader activePage="support-tickets" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1">
              Customer Success & Helpdesk Governance
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <LifeBuoy className="text-sky-400" size={28} /> Support Ticket Desk
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage student & educator enquiries, update resolution status, and dispatch official responses.
            </p>
          </div>

          <button
            onClick={fetchTickets}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Desk
          </button>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900 border border-white/[0.06] rounded-2xl p-5">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
              Total Enquiries <LifeBuoy size={14} className="text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">{counts.total}</div>
          </div>

          <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-5">
            <div className="text-xs font-semibold text-rose-400 mb-2 flex items-center justify-between">
              Open Tickets <AlertTriangle size={14} className="text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-400">{counts.open}</div>
          </div>

          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5">
            <div className="text-xs font-semibold text-amber-400 mb-2 flex items-center justify-between">
              In Progress <Clock size={14} className="text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400">{counts.inProgress}</div>
          </div>

          <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5">
            <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center justify-between">
              Resolved <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">{counts.resolved}</div>
          </div>

          <div className="bg-slate-900 border border-white/[0.06] rounded-2xl p-5">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
              Closed <XCircle size={14} className="text-slate-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-400">{counts.closed}</div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID, email, name…"
                className="pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs w-56 focus:outline-none focus:border-sky-500/50 placeholder:text-slate-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500/50 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open ({counts.open})</option>
              <option value="in_progress">In Progress ({counts.inProgress})</option>
              <option value="resolved">Resolved ({counts.resolved})</option>
              <option value="closed">Closed ({counts.closed})</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500/50 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical Glitch</option>
              <option value="verification">Teacher Verification</option>
              <option value="account">Account & Password</option>
              <option value="content">Content Query</option>
              <option value="other">Other</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500/50 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500/50 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="educator">Educator</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 text-right">
            Showing <strong className="text-white">{tickets.length}</strong> ticket records
          </div>
        </div>

        {/* Master Support Tickets Table */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-16 text-center text-slate-500">Loading support tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <LifeBuoy size={36} className="mx-auto text-slate-600 opacity-40" />
              <h3 className="font-bold text-white text-base">No support tickets found</h3>
              <p className="text-xs text-slate-500">Try clearing filters or search queries.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-wider text-left border-b border-white/5">
                    <th className="px-6 py-3.5">Ticket ID</th>
                    <th className="px-5 py-3.5">Submitted By</th>
                    <th className="px-5 py-3.5">Category & Subject</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Created Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tickets.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => openTicketDrawer(t)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg">
                          #{t.ticketId}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{t.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <span>{t.email}</span>
                          <span>•</span>
                          <span className="capitalize text-sky-400 font-medium">{t.role}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-semibold text-white text-sm truncate">{t.subject}</div>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-slate-400 bg-black/30 border border-white/10 px-2 py-0.5 rounded">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] uppercase border ${priorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize border ${statusBadge(t.status)}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTicketDrawer(t);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold hover:bg-sky-500/20 transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          Inspect <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ─── ENTERPRISE TICKET INSPECTOR DRAWER / MODAL ───────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 font-sans animate-in fade-in zoom-in duration-150">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-xl">
                  Ticket #{selectedTicket.ticketId}
                </span>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase border ${statusBadge(selectedTicket.status)}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Info Card */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-semibold tracking-wider block text-[10px] mb-1">Requester Name</span>
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <User size={14} className="text-sky-400" /> {selectedTicket.name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold tracking-wider block text-[10px] mb-1">Email Address</span>
                <span className="font-semibold text-slate-300 flex items-center gap-1.5 truncate">
                  <Mail size={14} className="text-sky-400 shrink-0" /> {selectedTicket.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold tracking-wider block text-[10px] mb-1">Mobile / Phone</span>
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Phone size={14} className="text-sky-400 shrink-0" /> {selectedTicket.phone || <span className="text-slate-500 font-normal italic">Not provided</span>}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold tracking-wider block text-[10px] mb-1">Role / Category</span>
                <span className="font-semibold text-sky-400 capitalize">
                  {selectedTicket.role} • {selectedTicket.category}
                </span>
              </div>
            </div>

            {/* Ticket Subject & Message Content */}
            <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
              <h3 className="text-lg font-bold text-white">{selectedTicket.subject}</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block pt-2">User Message</span>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-black/30 p-4 rounded-xl border border-white/5">
                {selectedTicket.message}
              </p>
            </div>

            {/* Admin Management Controls Form */}
            <form onSubmit={handleUpdateTicket} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Update Ticket Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:border-sky-500/50 cursor-pointer"
                  >
                    <option value="open">Open (Needs Attention)</option>
                    <option value="in_progress">In Progress (Investigating)</option>
                    <option value="resolved">Resolved (Solution Sent)</option>
                    <option value="closed">Closed (Archived)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Update Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:border-sky-500/50 cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>
              </div>

              {/* Official Response to User */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Official Admin Response (Emailed to User)</span>
                  <span className="text-slate-500 text-[11px] font-normal">Sent to {selectedTicket.email}</span>
                </label>
                <textarea
                  rows={3}
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                  placeholder="Write official resolution or response to send to user…"
                  className="w-full p-3.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-sky-500/50 leading-relaxed resize-none placeholder:text-slate-600"
                />
              </div>

              {/* Internal Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Internal Admin Investigation Note (Private to Admins)
                </label>
                <input
                  type="text"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Add internal note (e.g. verified teacher credential in DB)…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600"
                />
              </div>

              {/* Internal Audit Notes Log */}
              {selectedTicket.adminNotes && selectedTicket.adminNotes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Internal Admin Notes History:
                  </span>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedTicket.adminNotes.map((n, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/50 border border-white/5 text-xs text-slate-300 flex items-center justify-between">
                        <div>
                          <strong className="text-sky-400">{n.addedBy}:</strong> {n.note}
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                          {new Date(n.addedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/5 cursor-pointer transition-all"
                >
                  Close Inspector
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold cursor-pointer transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  {updating ? 'Saving Changes...' : 'Save & Dispatch Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
