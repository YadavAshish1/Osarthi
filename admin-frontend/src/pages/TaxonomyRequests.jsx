import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AdminHeader from '../components/AdminHeader';
import {
  Send, Clock, CheckCircle2, XCircle, BookOpen, Layers,
  RefreshCw, Search, AlertCircle, Check, X, MessageSquare,
} from 'lucide-react';

export default function TaxonomyRequests() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveRequestItem, setApproveRequestItem] = useState(null);
  const [approvedName, setApprovedName] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminSuggestion, setAdminSuggestion] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/taxonomy-requests', { params: { status: statusFilter } });
      if (data?.requests) setRequests(data.requests);
      if (data?.stats) setStats(data.stats);
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to fetch requests', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, addToast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openApproveModal = (reqItem) => {
    setApproveRequestItem(reqItem); setApprovedName(reqItem.name); setAdminNote(''); setApproveModalOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approveRequestItem || !approvedName.trim()) { addToast('Enter a valid name', 'error'); return; }
    setSubmittingReview(true);
    try {
      const { data } = await api.put(`/taxonomy-requests/${approveRequestItem._id}/review`, {
        action: 'approve', approvedName: approvedName.trim(), adminNote: adminNote.trim(),
      });
      addToast(data?.message || 'Approved!', 'success'); setApproveModalOpen(false); fetchRequests();
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to approve', 'error'); }
    finally { setSubmittingReview(false); }
  };

  const openRejectModal = (reqItem) => {
    setSelectedRequest(reqItem); setRejectionReason(''); setAdminSuggestion(''); setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !rejectionReason.trim()) { addToast('Enter rejection reason', 'error'); return; }
    setSubmittingReview(true);
    try {
      const { data } = await api.put(`/taxonomy-requests/${selectedRequest._id}/review`, {
        action: 'reject', rejectionReason: rejectionReason.trim(), adminSuggestion: adminSuggestion.trim(),
      });
      addToast(data?.message || 'Rejected', 'success'); setRejectModalOpen(false); fetchRequests();
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to reject', 'error'); }
    finally { setSubmittingReview(false); }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedBy?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusBadge = (status) => {
    const map = {
      approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    };
    return map[status] || map.pending;
  };

  const typeBadge = (type) => type === 'class'
    ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
    : 'bg-purple-500/15 text-purple-400 border-purple-500/30';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl flex items-center gap-2 ${t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>
            {t.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {t.message}
          </div>
        ))}
      </div>

      <AdminHeader activePage="taxonomy-requests" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <p className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1">Taxonomy Governance</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Subject & Class Requests</h1>
          <p className="text-sm text-slate-400 mt-1">Review new subject/class requests from teachers.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { id: 'all', label: 'Total', value: stats.total, icon: Send, color: 'text-sky-400', border: 'border-sky-500/30' },
            { id: 'pending', label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400', border: 'border-amber-500/30' },
            { id: 'approved', label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/30' },
            { id: 'rejected', label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-400', border: 'border-red-500/30' },
          ].map(({ id, label, value, icon: Icon, color, border }) => (
            <button key={id} onClick={() => setStatusFilter(id)}
              className={`bg-slate-900 rounded-2xl p-5 text-left cursor-pointer transition-all ${
                statusFilter === id ? `border-2 ${border}` : 'border border-white/[0.06]'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">{label}</span>
                <Icon size={16} className={color} />
              </div>
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            </button>
          ))}
        </div>

        {/* Filter + Search Bar */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search requests..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500/50 placeholder:text-slate-500" />
          </div>
          <button onClick={fetchRequests} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:text-white transition-all cursor-pointer">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Requests List */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500">Loading requests…</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-16 text-center text-slate-600">No requests found.</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-wider text-left">
                      <th className="px-5 py-3.5">Requested Name</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Requested By</th>
                      <th className="px-5 py-3.5">Reason</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => (
                      <tr key={req._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 font-bold text-white">{req.name}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${typeBadge(req.type)}`}>
                            {req.type === 'class' ? <BookOpen size={10} /> : <Layers size={10} />} {req.type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white text-xs">{req.requestedBy?.name || '—'}</div>
                          <div className="text-[11px] text-slate-500">{req.requestedBy?.email}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs max-w-[200px] truncate">{req.reason || '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(req.status)}`}>{req.status}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs">{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openApproveModal(req)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer">
                                <Check size={11} /> Approve
                              </button>
                              <button onClick={() => openRejectModal(req)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all cursor-pointer">
                                <X size={11} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-3">
                {filteredRequests.map((req) => (
                  <div key={`m-${req._id}`} className="bg-slate-800/60 border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{req.name}</h4>
                        <p className="text-xs text-slate-500">{req.requestedBy?.name} • {req.requestedBy?.email}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${typeBadge(req.type)}`}>
                        {req.type}
                      </span>
                    </div>
                    {req.reason && <p className="text-xs text-slate-400 mb-2 leading-relaxed line-clamp-2">{req.reason}</p>}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(req.status)}`}>{req.status}</span>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => openApproveModal(req)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold cursor-pointer">
                          <Check size={12} /> Approve
                        </button>
                        <button onClick={() => openRejectModal(req)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold cursor-pointer">
                          <X size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Approve Modal */}
      {approveModalOpen && approveRequestItem && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2"><CheckCircle2 size={18} /> Approve Request</h3>
              <button onClick={() => setApproveModalOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 mb-4 text-sm text-slate-300">
              <strong className="text-white">{approveRequestItem.requestedBy?.name}</strong> requested to add <strong className="text-emerald-400">{approveRequestItem.name}</strong> as a new {approveRequestItem.type}.
            </div>
            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Approved Name <span className="text-red-400">*</span></label>
                <input type="text" required value={approvedName} onChange={(e) => setApprovedName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Admin Note (Optional)</label>
                <textarea rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="e.g. Standardized name to match taxonomy..."
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm resize-y focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setApproveModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={submittingReview || !approvedName.trim()} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-bold cursor-pointer hover:bg-emerald-400 disabled:opacity-40 transition-all">
                  {submittingReview ? 'Approving...' : 'Approve & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2"><XCircle size={18} /> Reject Request</h3>
              <button onClick={() => setRejectModalOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Rejection Reason <span className="text-red-400">*</span></label>
                <textarea rows={3} required value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Why is this request being rejected?"
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm resize-y focus:outline-none focus:border-red-500/50 placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Suggestion for Teacher (Optional)</label>
                <textarea rows={2} value={adminSuggestion} onChange={(e) => setAdminSuggestion(e.target.value)} placeholder="e.g. Please use 'Applied Physics' instead..."
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm resize-y focus:outline-none focus:border-red-500/50 placeholder:text-slate-600" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRejectModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={submittingReview || !rejectionReason.trim()} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold cursor-pointer hover:bg-red-400 disabled:opacity-40 transition-all">
                  {submittingReview ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
