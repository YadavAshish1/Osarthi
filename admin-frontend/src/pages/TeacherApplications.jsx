import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users, CheckCircle2, XCircle, Clock, Search, Filter,
  RefreshCw, Check, X, Eye, GraduationCap, Briefcase,
  Mail, Phone, Calendar, ArrowLeft, LogOut, ShieldCheck, AlertCircle
} from 'lucide-react';

export default function TeacherApplications() {
  const { user, logout } = useAuth();

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, statsRes] = await Promise.all([
        api.get('/teacher-applications', {
          params: { status: filterStatus !== 'all' ? filterStatus : undefined },
        }),
        api.get('/teacher-applications/stats'),
      ]);

      if (appRes.data?.applications) {
        setApplications(appRes.data.applications);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch {
      addToast('Failed to load applications', 'error');
    } fontFinally: {
      setLoading(false);
    }
  }, [filterStatus, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (appId) => {
    setReviewing(true);
    try {
      const { data } = await api.put(`/teacher-applications/${appId}/review`, {
        action: 'approve',
      });
      addToast(data.message || 'Teacher approved successfully!', 'success');
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      addToast('Please enter a rejection reason', 'error');
      return;
    }
    setReviewing(true);
    try {
      const { data } = await api.put(`/teacher-applications/${selectedApp._id}/review`, {
        action: 'reject',
        rejectionReason: rejectionReason.trim(),
      });
      addToast(data.message || 'Application rejected', 'success');
      setRejectionModalOpen(false);
      setSelectedApp(null);
      setRejectionReason('');
      fetchData();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f172a)', color: 'var(--text-primary, #f8fafc)' }}>
      {/* Header */}
      <header className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/dashboard" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.8 }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </a>
          <span style={{ opacity: 0.3 }}>|</span>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Teacher Applications</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            <ShieldCheck size={14} style={{ display: 'inline', marginRight: 6 }} />
            {user?.name || user?.email}
          </div>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '6px 12px', fontSize: 12 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div style={{ padding: '32px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', opacity: 0.6 }}>Total Applications</span>
              <Users size={18} style={{ color: '#38bdf8' }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.total}</div>
          </div>

          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#f59e0b' }}>Pending Review</span>
              <Clock size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{stats.pending}</div>
          </div>

          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#10b981' }}>Approved</span>
              <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{stats.approved}</div>
          </div>

          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#ef4444' }}>Rejected</span>
              <XCircle size={18} style={{ color: '#ef4444' }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>{stats.rejected}</div>
          </div>
        </div>

        {/* Filter Controls & Reload */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'pending', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  border: filterStatus === st ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: filterStatus === st ? 'rgba(56,189,248,0.15)' : 'transparent',
                  color: filterStatus === st ? '#38bdf8' : 'inherit',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', cursor: 'pointer' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Applications Table */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.6 }}>Loading applications…</div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.6 }}>
              No applications found for current filter.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', opacity: 0.7 }}>
                  <th style={{ padding: '14px 20px' }}>Applicant</th>
                  <th style={{ padding: '14px 20px' }}>Subjects</th>
                  <th style={{ padding: '14px 20px' }}>Applied Date</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Reviewed By</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{app.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{app.email}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(app.subjects || []).slice(0, 3).map((sub) => (
                          <span key={sub} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', opacity: 0.7 }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 12,
                          textTransform: 'uppercase',
                          background:
                            app.status === 'approved'
                              ? 'rgba(16,185,129,0.15)'
                              : app.status === 'rejected'
                              ? 'rgba(239,68,68,0.15)'
                              : 'rgba(245,158,11,0.15)',
                          color:
                            app.status === 'approved'
                              ? '#10b981'
                              : app.status === 'rejected'
                              ? '#ef4444'
                              : '#f59e0b',
                          border:
                            app.status === 'approved'
                              ? '1px solid rgba(16,185,129,0.3)'
                              : app.status === 'rejected'
                              ? '1px solid rgba(239,68,68,0.3)'
                              : '1px solid rgba(245,158,11,0.3)',
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', opacity: 0.7 }}>
                      {app.reviewedBy ? app.reviewedBy.name || app.reviewedBy.email : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedApp(app)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#38bdf8',
                          color: '#0f172a',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Eye size={13} /> View & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 28, color: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedApp.name}</h3>
                <p style={{ fontSize: 12, opacity: 0.6, margin: '2px 0 0 0' }}>{selectedApp.email} {selectedApp.phone && `• ${selectedApp.phone}`}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ spaceY: 16 }}>
              {/* Education */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GraduationCap size={14} /> Education & Degrees
                </h4>
                {(selectedApp.education || []).length > 0 ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {selectedApp.education.map((e, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, fontSize: 13 }}>
                        <strong style={{ color: '#f8fafc' }}>{e.degree}</strong> — {e.institution} ({e.year})
                      </div>
                    ))}
                  </div>
                ) : <span style={{ fontSize: 12, opacity: 0.5 }}>None provided</span>}
              </div>

              {/* Experience */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={14} /> Teaching Experience
                </h4>
                {(selectedApp.experience || []).length > 0 ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {selectedApp.experience.map((exp, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, fontSize: 13 }}>
                        <strong style={{ color: '#f8fafc' }}>{exp.title}</strong> — {exp.organization} ({exp.duration})
                      </div>
                    ))}
                  </div>
                ) : <span style={{ fontSize: 12, opacity: 0.5 }}>None provided</span>}
              {/* Subjects */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', marginBottom: 8 }}>
                  Subjects to Teach
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(selectedApp.subjects || []).map((sub) => (
                    <span key={sub} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#f8fafc' }}>
                      {sub}
                    </span>
                  ))}
                  {(selectedApp.requestedSubjects || []).map((sub) => (
                    <span key={sub} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontWeight: 600 }}>
                      {sub} (Proposed New Subject)
                    </span>
                  ))}
                </div>
                {(selectedApp.requestedSubjects || []).length > 0 && (
                  <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>
                    ℹ️ Approving will automatically add proposed new subject(s) to database taxonomy.
                  </p>
                )}
              </div>

              {/* Bio & Motivation */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6 }}>Professional Bio</h4>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>
                  {selectedApp.bio || 'No bio provided'}
                </div>
              </div>

              {/* Rejection Reason display if rejected */}
              {selectedApp.status === 'rejected' && selectedApp.rejectionReason && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Rejection Reason:</div>
                  <div style={{ fontSize: 13, color: '#fca5a5', marginTop: 4 }}>{selectedApp.rejectionReason}</div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              {selectedApp.status === 'pending' ? (
                <>
                  <button
                    disabled={reviewing}
                    onClick={() => setRejectionModalOpen(true)}
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer' }}
                  >
                    Reject Application
                  </button>

                  <button
                    disabled={reviewing}
                    onClick={() => handleApprove(selectedApp._id)}
                    style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#10b981', color: '#0f172a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Check size={16} /> Approve & Upgrade to Teacher
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 13, opacity: 0.6 }}>
                  This application has already been {selectedApp.status}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Prompt Modal */}
      {rejectionModalOpen && selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 110 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, maxWidth: 480, width: '100%', padding: 24 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: '#ef4444' }}>Reject Application</h4>
            <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px 0' }}>
              Please specify the reason for rejecting {selectedApp.name}'s application. This reason will be sent to their email.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Qualifications could not be verified or missing teaching experience..."
                style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 13, marginBottom: 20, resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  style={{ padding: '8px 20px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {reviewing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              background: t.type === 'success' ? '#10b981' : '#ef4444',
              color: '#fff',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
