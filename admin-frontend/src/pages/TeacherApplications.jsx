import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AdminHeader from '../components/AdminHeader';
import {
  Users, CheckCircle2, XCircle, Clock, RefreshCw, Check, X, Eye,
  GraduationCap, Briefcase, AlertCircle,
} from 'lucide-react';

export default function TeacherApplications() {
  const { user } = useAuth();

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
        api.get('/teacher-applications', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/teacher-applications/stats'),
      ]);
      if (appRes.data?.applications) setApplications(appRes.data.applications);
      if (statsRes.data) setStats(statsRes.data);
    } catch { addToast('Failed to load applications', 'error'); }
    finally { setLoading(false); }
  }, [filterStatus, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (appId) => {
    setReviewing(true);
    try {
      const { data } = await api.put(`/teacher-applications/${appId}/review`, { action: 'approve' });
      addToast(data.message || 'Teacher approved!', 'success'); setSelectedApp(null); fetchData();
    } catch (err) { addToast(err?.response?.data?.message || 'Approval failed', 'error'); }
    finally { setReviewing(false); }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) { addToast('Enter rejection reason', 'error'); return; }
    setReviewing(true);
    try {
      const { data } = await api.put(`/teacher-applications/${selectedApp._id}/review`, { action: 'reject', rejectionReason: rejectionReason.trim() });
      addToast(data.message || 'Application rejected', 'success');
      setRejectionModalOpen(false); setSelectedApp(null); setRejectionReason(''); fetchData();
    } catch (err) { addToast(err?.response?.data?.message || 'Rejection failed', 'error'); }
    finally { setReviewing(false); }
  };

  const statusBadge = (status) => {
    const map = {
      approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    };
    return map[status] || map.pending;
  };

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

      <AdminHeader activePage="applications" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <p className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1">Educator Verification</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Teacher Applications</h1>
          <p className="text-sm text-slate-400 mt-1">Review and manage educator applications.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Users, color: 'text-sky-400' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-900 border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">{label}</span>
                <Icon size={16} className={color} />
              </div>
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected'].map((st) => (
              <button key={st} onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  filterStatus === st ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}>
                {st}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:text-white transition-all cursor-pointer">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Applications Table */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500">Loading applications…</div>
          ) : applications.length === 0 ? (
            <div className="p-16 text-center text-slate-600">No applications found for current filter.</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-wider text-left">
                      <th className="px-5 py-3.5">Applicant</th>
                      <th className="px-5 py-3.5">Subjects</th>
                      <th className="px-5 py-3.5">Applied</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Reviewed By</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-white">{app.name}</div>
                          <div className="text-xs text-slate-500">{app.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(app.subjects || []).slice(0, 3).map((sub) => (
                              <span key={sub} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-slate-300">{sub}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs">{new Date(app.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(app.status)}`}>{app.status}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs">{app.reviewedBy ? app.reviewedBy.name || app.reviewedBy.email : '—'}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => setSelectedApp(app)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition-all cursor-pointer ml-auto">
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-3">
                {applications.map((app) => (
                  <div key={`m-${app._id}`} className="bg-slate-800/60 border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{app.name}</h4>
                        <p className="text-xs text-slate-500">{app.email}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(app.status)}`}>{app.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(app.subjects || []).slice(0, 3).map((sub) => (
                        <span key={sub} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-slate-300">{sub}</span>
                      ))}
                    </div>
                    <button onClick={() => setSelectedApp(app)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-bold cursor-pointer">
                      <Eye size={13} /> View & Review
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedApp.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedApp.email} {selectedApp.phone && `• ${selectedApp.phone}`}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-500 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              {/* Education */}
              <div>
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><GraduationCap size={14} /> Education & Degrees</h4>
                {(selectedApp.education || []).length > 0 ? (
                  <div className="space-y-2">
                    {selectedApp.education.map((e, idx) => (
                      <div key={idx} className="bg-white/[0.03] rounded-lg p-3 text-sm">
                        <strong className="text-white">{e.degree}</strong> — {e.institution} ({e.year})
                      </div>
                    ))}
                  </div>
                ) : <span className="text-xs text-slate-500">None provided</span>}
              </div>

              {/* Experience */}
              <div>
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Briefcase size={14} /> Teaching Experience</h4>
                {(selectedApp.experience || []).length > 0 ? (
                  <div className="space-y-2">
                    {selectedApp.experience.map((exp, idx) => (
                      <div key={idx} className="bg-white/[0.03] rounded-lg p-3 text-sm">
                        <strong className="text-white">{exp.title}</strong> — {exp.organization} ({exp.duration})
                      </div>
                    ))}
                  </div>
                ) : <span className="text-xs text-slate-500">None provided</span>}
              </div>

              {/* Subjects */}
              <div>
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">Subjects to Teach</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedApp.subjects || []).map((sub) => (
                    <span key={sub} className="text-xs px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white">{sub}</span>
                  ))}
                  {(selectedApp.requestedSubjects || []).map((sub) => (
                    <span key={sub} className="text-xs px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold">{sub} (New)</span>
                  ))}
                </div>
                {(selectedApp.requestedSubjects || []).length > 0 && (
                  <p className="text-[11px] text-amber-400 mt-2">ℹ️ Approving will add proposed subject(s) to taxonomy.</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">Professional Bio</h4>
                <div className="bg-white/[0.03] rounded-lg p-4 text-sm text-slate-300 italic leading-relaxed">{selectedApp.bio || 'No bio provided'}</div>
              </div>

              {/* Rejection Reason */}
              {selectedApp.status === 'rejected' && selectedApp.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="text-[11px] font-bold text-red-400 uppercase mb-1">Rejection Reason:</div>
                  <div className="text-sm text-red-300">{selectedApp.rejectionReason}</div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="border-t border-white/[0.06] pt-5 mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
              {selectedApp.status === 'pending' ? (
                <>
                  <button disabled={reviewing} onClick={() => setRejectionModalOpen(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-all cursor-pointer disabled:opacity-40">
                    Reject Application
                  </button>
                  <button disabled={reviewing} onClick={() => handleApprove(selectedApp._id)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-40">
                    <Check size={15} /> Approve & Upgrade
                  </button>
                </>
              ) : (
                <div className="text-sm text-slate-500">This application has been {selectedApp.status}.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-red-400 mb-2">Reject Application</h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Please specify the reason for rejecting {selectedApp.name}'s application.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Qualifications could not be verified..."
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm resize-y focus:outline-none focus:border-red-500/50 placeholder:text-slate-600" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setRejectionModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={reviewing} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold cursor-pointer hover:bg-red-400 disabled:opacity-40 transition-all">
                  {reviewing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
