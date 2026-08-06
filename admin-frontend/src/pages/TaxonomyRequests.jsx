import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Layers,
  Filter,
  RefreshCw,
  Search,
  ArrowLeft,
  LogOut,
  AlertCircle,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

export default function TaxonomyRequests() {
  const { user, logout } = useAuth();

  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Approval Modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveRequestItem, setApproveRequestItem] = useState(null);
  const [approvedName, setApprovedName] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Rejection Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminSuggestion, setAdminSuggestion] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/taxonomy-requests', {
        params: { status: statusFilter },
      });
      if (data?.requests) setRequests(data.requests);
      if (data?.stats) setStats(data.stats);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to fetch taxonomy requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const openApproveModal = (reqItem) => {
    setApproveRequestItem(reqItem);
    setApprovedName(reqItem.name);
    setAdminNote('');
    setApproveModalOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approveRequestItem || !approvedName.trim()) {
      addToast('Please enter a valid approved name', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const { data } = await api.put(`/taxonomy-requests/${approveRequestItem._id}/review`, {
        action: 'approve',
        approvedName: approvedName.trim(),
        adminNote: adminNote.trim(),
      });
      addToast(data?.message || 'Request approved successfully!', 'success');
      setApproveModalOpen(false);
      fetchRequests();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to approve request', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openRejectModal = (reqItem) => {
    setSelectedRequest(reqItem);
    setRejectionReason('');
    setAdminSuggestion('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !rejectionReason.trim()) {
      addToast('Please enter a rejection reason', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const { data } = await api.put(`/taxonomy-requests/${selectedRequest._id}/review`, {
        action: 'reject',
        rejectionReason: rejectionReason.trim(),
        adminSuggestion: adminSuggestion.trim(),
      });
      addToast(data?.message || 'Request rejected and teacher notified', 'success');
      setRejectModalOpen(false);
      fetchRequests();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to reject request', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedBy?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              background: t.type === 'error' ? '#ef4444' : '#10b981',
              color: '#fff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {t.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justify: 'space-between', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/dashboard" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={20} color="#38bdf8" />
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Category & Taxonomy Requests
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', color: '#7dd3fc', fontWeight: 600 }}>
            Role: {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: 13, cursor: 'pointer' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stat Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div
            onClick={() => setStatusFilter('all')}
            style={{
              padding: 20,
              borderRadius: 14,
              background: '#1e293b',
              border: statusFilter === 'all' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Requests</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>{stats.total}</div>
          </div>

          <div
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: 20,
              borderRadius: 14,
              background: 'rgba(245,158,11,0.08)',
              border: statusFilter === 'pending' ? '2px solid #f59e0b' : '1px solid rgba(245,158,11,0.25)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending Review</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fef08a', marginTop: 4 }}>{stats.pending}</div>
          </div>

          <div
            onClick={() => setStatusFilter('approved')}
            style={{
              padding: 20,
              borderRadius: 14,
              background: 'rgba(16,185,129,0.08)',
              border: statusFilter === 'approved' ? '2px solid #10b981' : '1px solid rgba(10,185,129,0.25)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Approved & Created</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#a7f3d0', marginTop: 4 }}>{stats.approved}</div>
          </div>

          <div
            onClick={() => setStatusFilter('rejected')}
            style={{
              padding: 20,
              borderRadius: 14,
              background: 'rgba(239,68,68,0.08)',
              border: statusFilter === 'rejected' ? '2px solid #ef4444' : '1px solid rgba(239,68,68,0.25)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Rejected</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fca5a5', marginTop: 4 }}>{stats.rejected}</div>
          </div>
        </div>

        {/* Top Control Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {['pending', 'approved', 'rejected', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: statusFilter === st ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: statusFilter === st ? '#38bdf8' : 'rgba(255,255,255,0.04)',
                  color: statusFilter === st ? '#0f172a' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {st === 'all' ? 'All Statuses' : st}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search name, teacher, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '9px 14px 9px 36px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, width: 240 }}
              />
            </div>

            <button
              onClick={fetchRequests}
              style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}
              title="Refresh Requests"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, opacity: 0.9 }}>
              Category Requests ({filteredRequests.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              Loading taxonomy requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No requests found matching the selected filter.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
                  <th style={{ padding: '14px 20px' }}>Teacher Info</th>
                  <th style={{ padding: '14px 20px' }}>Type</th>
                  <th style={{ padding: '14px 20px' }}>Requested Name</th>
                  <th style={{ padding: '14px 20px' }}>Parent Class</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{r.requestedBy?.name || 'Teacher'}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.requestedBy?.email}</div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: r.type === 'class' ? 'rgba(56,189,248,0.15)' : 'rgba(168,85,247,0.15)',
                          border: r.type === 'class' ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(168,85,247,0.4)',
                          color: r.type === 'class' ? '#7dd3fc' : '#c084fc',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {r.type === 'class' ? <BookOpen size={12} /> : <Layers size={12} />}
                        {r.type}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px', color: '#fff' }}>
                      <div style={{ fontWeight: 700 }}>{r.approvedName || r.name}</div>
                      {r.originalName && r.approvedName && r.originalName.toLowerCase() !== r.approvedName.toLowerCase() && (
                        <div style={{ fontSize: 10, color: '#38bdf8', marginTop: 2, background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                          Standardised from "{r.originalName}"
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 12 }}>
                      {r.className || r.classRef?.name || '—'}
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      {r.status === 'pending' && (
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fef08a', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> Pending Review
                        </span>
                      )}
                      {r.status === 'approved' && (
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#a7f3d0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Approved & Created
                        </span>
                      )}
                      {r.status === 'rejected' && (
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 12 }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            onClick={() => openApproveModal(r)}
                            style={{ padding: '6px 14px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(r)}
                            style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#64748b' }}>Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Approve Modal with Name Standardisation */}
      {approveModalOpen && approveRequestItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={18} /> Approve & Standardise Category
              </h3>
              <button onClick={() => setApproveModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Approving <strong style={{ color: '#fff' }}>"{approveRequestItem.name}"</strong> ({approveRequestItem.type}) requested by <strong style={{ color: '#fff' }}>{approveRequestItem.requestedBy?.name}</strong>.
            </p>

            <form onSubmit={handleApproveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                  Standardised Approved Name <span style={{ color: '#10b981' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={approvedName}
                  onChange={(e) => setApprovedName(e.target.value)}
                  placeholder="e.g. Mathematics, Class 10"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, fontWeight: 600 }}
                />
                {approveRequestItem.name.toLowerCase() !== approvedName.trim().toLowerCase() && (
                  <p style={{ fontSize: 11, color: '#38bdf8', marginTop: 4 }}>
                    Notice: Name will be updated from "{approveRequestItem.name}" to "{approvedName.trim()}".
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                  Admin Note / Message for Teacher (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Standardised to match official curriculum naming conventions..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(false)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !approvedName.trim()}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: submittingReview || !approvedName.trim() ? 0.5 : 1 }}
                >
                  {submittingReview ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justify: 'center', padding: 20, zIndex: 9999 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={18} /> Reject Request
              </h3>
              <button onClick={() => setRejectModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Rejecting <strong style={{ color: '#fff' }}>"{selectedRequest.name}"</strong> requested by <strong style={{ color: '#fff' }}>{selectedRequest.requestedBy?.name}</strong>.
            </p>

            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                  Rejection Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason why this Class/Subject cannot be added..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                  Admin Suggestion / Alternative (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adminSuggestion}
                  onChange={(e) => setAdminSuggestion(e.target.value)}
                  placeholder="Recommend an existing Class or Subject to use instead..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !rejectionReason.trim()}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: submittingReview || !rejectionReason.trim() ? 0.5 : 1 }}
                >
                  {submittingReview ? 'Submitting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
