import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AdminHeader from '../components/AdminHeader';
import {
  Users, UserPlus, Search, RefreshCw, Power, Trash2, CheckCircle2, AlertCircle,
} from 'lucide-react';

export default function UserManagement() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [creating, setCreating] = useState(false);

  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/superadmin/users', {
        params: { role: filterRole !== 'all' ? filterRole : undefined, q: searchQuery.trim() || undefined },
      });
      if (data?.users) { setUsers(data.users); setTotalUsers(data.total || data.users.length); }
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to fetch users', 'error'); }
    finally { setLoading(false); }
  }, [filterRole, searchQuery, addToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) { addToast('Fill all fields', 'error'); return; }
    if (newUserPassword.length < 8) { addToast('Password must be 8+ chars', 'error'); return; }
    setCreating(true);
    try {
      const { data } = await api.post('/superadmin/users', { name: newUserName.trim(), email: newUserEmail.trim(), password: newUserPassword, role: newUserRole });
      addToast(data.message || 'User created!', 'success');
      setCreateModalOpen(false); setNewUserName(''); setNewUserEmail(''); setNewUserPassword(''); setNewUserRole('admin'); fetchUsers();
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to create user', 'error'); }
    finally { setCreating(false); }
  };

  const handleToggleStatus = async (targetUser) => {
    try {
      const { data } = await api.put(`/superadmin/users/${targetUser._id}/toggle-status`);
      addToast(data.message || 'Status updated', 'success'); fetchUsers();
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to update', 'error'); }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeleting(true);
    try {
      const { data } = await api.delete(`/superadmin/users/${deleteModalUser._id}`);
      addToast(data.message || 'User deleted', 'success'); setDeleteModalUser(null); fetchUsers();
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to delete', 'error'); }
    finally { setDeleting(false); }
  };

  const roleBadge = (role) => {
    const map = {
      super_admin: 'bg-red-500/15 text-red-400 border-red-500/30',
      admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      teacher: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      student: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    };
    return map[role] || map.student;
  };
  const roleLabel = (r) => r === 'super_admin' ? 'Super Admin' : r?.charAt(0).toUpperCase() + r?.slice(1);

  const roles = user?.role === 'admin' ? ['all', 'admin', 'teacher', 'student'] : ['all', 'super_admin', 'admin', 'teacher', 'student'];

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

      <AdminHeader activePage="users" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1">Administration</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">User Management</h1>
            <p className="text-sm text-slate-400 mt-1">Manage all registered users across roles.</p>
          </div>
          <button onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 cursor-pointer">
            <UserPlus size={15} /> Create User
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {roles.map((r) => (
              <button key={r} onClick={() => setFilterRole(r)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  filterRole === r ? 'bg-sky-500 text-slate-950' : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}>
                {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name or email..."
                className="pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs w-52 focus:outline-none focus:border-sky-500/50 placeholder:text-slate-500" />
            </div>
            <button onClick={fetchUsers} className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer" title="Refresh">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2"><Users size={16} className="text-sky-400" /> Registered Users ({totalUsers})</h3>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-500">Loading user directory...</div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-slate-600">No users found matching filter criteria.</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-wider text-left">
                      <th className="px-5 py-3.5">User Details</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Joined</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = user && user._id === u._id;
                      const isActive = u.isActive !== false;
                      return (
                        <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-white">{u.name} {isSelf && <span className="text-sky-400 text-xs">(You)</span>}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${roleBadge(u.role)}`}>{roleLabel(u.role)}</span>
                          </td>
                          <td className="px-5 py-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">Off</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button disabled={isSelf} onClick={() => handleToggleStatus(u)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isActive ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                <Power size={11} /> {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button disabled={isSelf} onClick={() => setDeleteModalUser(u)}
                                className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-3">
                {users.map((u) => {
                  const isSelf = user && user._id === u._id;
                  const isActive = u.isActive !== false;
                  return (
                    <div key={`m-${u._id}`} className="bg-slate-800/60 border border-white/[0.06] rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-white text-sm">{u.name} {isSelf && <span className="text-sky-400 text-xs">(You)</span>}</h4>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${roleBadge(u.role)}`}>{roleLabel(u.role)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                        {isActive ? <span className="text-emerald-400 font-semibold">● Active</span> : <span className="text-red-400 font-semibold">● Off</span>}
                      </div>
                      <div className="flex gap-2">
                        <button disabled={isSelf} onClick={() => handleToggleStatus(u)}
                          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 ${isActive ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
                          <Power size={12} /> {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button disabled={isSelf} onClick={() => setDeleteModalUser(u)}
                          className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold cursor-pointer disabled:opacity-40">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2"><UserPlus size={18} /> Create New User</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input type="text" required value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Email Address <span className="text-red-400">*</span></label>
                <input type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="admin@medhashine.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Password <span className="text-red-400">*</span></label>
                <input type="password" required minLength={8} value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="At least 8 characters"
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Assign Role</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 cursor-pointer">
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  {user?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-slate-950 text-sm font-bold cursor-pointer hover:bg-sky-400 disabled:opacity-40 transition-all">
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-red-400 mb-2">Delete Account</h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              Are you sure you want to permanently delete <strong className="text-white">{deleteModalUser.name}</strong> ({deleteModalUser.email})? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModalUser(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleDeleteUser} disabled={deleting} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold cursor-pointer hover:bg-red-400 disabled:opacity-40 transition-all">
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
