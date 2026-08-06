import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserPlus, Shield, ShieldAlert, CheckCircle, XCircle,
  Search, Filter, LogOut, ArrowLeft, Trash2, Power, UserCheck, RefreshCw
} from 'lucide-react';

export default function UserManagement() {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create User Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [creating, setCreating] = useState(false);

  // Delete modal state
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toasts
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
        params: {
          role: filterRole !== 'all' ? filterRole : undefined,
          q: searchQuery.trim() || undefined,
        },
      });
      if (data?.users) {
        setUsers(data.users);
        setTotalUsers(data.total || data.users.length);
      }
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterRole, searchQuery, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    if (newUserPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post('/superadmin/users', {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
      });
      addToast(data.message || 'User created successfully', 'success');
      setCreateModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('admin');
      fetchUsers();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    try {
      const { data } = await api.put(`/superadmin/users/${targetUser._id}/toggle-status`);
      addToast(data.message || 'Account status updated', 'success');
      fetchUsers();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeleting(true);
    try {
      const { data } = await api.delete(`/superadmin/users/${deleteModalUser._id}`);
      addToast(data.message || 'User deleted successfully', 'success');
      setDeleteModalUser(null);
      fetchUsers();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const roleBadges = {
    super_admin: { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)', text: '#fca5a5', label: 'Super Admin' },
    admin: { bg: 'rgba(168,85,247,0.2)', border: 'rgba(168,85,247,0.5)', text: '#d8b4fe', label: 'Admin' },
    teacher: { bg: 'rgba(56,189,248,0.2)', border: 'rgba(56,189,248,0.5)', text: '#7dd3fc', label: 'Teacher' },
    student: { bg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.5)', text: '#86efac', label: 'Student' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/dashboard" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} color={user?.role === 'super_admin' ? '#ef4444' : '#38bdf8'} />
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              {user?.role === 'super_admin' ? 'Super Admin User Directory' : 'User Directory'}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: user?.role === 'super_admin' ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.15)', border: user?.role === 'super_admin' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(56,189,248,0.4)', color: user?.role === 'super_admin' ? '#fca5a5' : '#7dd3fc', fontWeight: 600 }}>
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

      {/* Main Container */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Top Control Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Role Filter Tabs */}
            {(user?.role === 'admin'
              ? ['all', 'admin', 'teacher', 'student']
              : ['all', 'super_admin', 'admin', 'teacher', 'student']
            ).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: filterRole === r ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: filterRole === r ? '#38bdf8' : 'rgba(255,255,255,0.04)',
                  color: filterRole === r ? '#0f172a' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '9px 14px 9px 36px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, width: 220 }}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchUsers}
              style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}
              title="Refresh Users"
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>

            {/* Create User CTA */}
            <button
              onClick={() => setCreateModalOpen(true)}
              style={{ padding: '9px 18px', borderRadius: 10, background: '#38bdf8', color: '#0f172a', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <UserPlus size={16} /> Create User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, opacity: 0.9 }}>
              Total Registered Users ({totalUsers})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', opacity: 0.6, fontSize: 14 }}>
              Loading user directory...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', opacity: 0.6, fontSize: 14 }}>
              No users found matching filter criteria.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAliign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
                  <th style={{ padding: '14px 20px' }}>User Details</th>
                  <th style={{ padding: '14px 20px' }}>Role</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Joined Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const badge = roleBadges[u.role] || roleBadges.student;
                  const isSelf = user && user._id === u._id;
                  const isActive = u.isActive !== false;

                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name} {isSelf && '(You)'}</div>
                        <div style={{ fontSize: 12, opacity: 0.6 }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: isActive ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)', color: isActive ? '#4ade80' : '#fca5a5' }}>
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', opacity: 0.6 }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {/* Toggle Active/Deactivate Button */}
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleStatus(u)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              background: isActive ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                              border: isActive ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
                              color: isActive ? '#fca5a5' : '#4ade80',
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              opacity: isSelf ? 0.5 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title={isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            <Power size={13} /> {isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Delete Button */}
                          <button
                            disabled={isSelf}
                            onClick={() => setDeleteModalUser(u)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              fontSize: 12,
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              color: '#ef4444',
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              opacity: isSelf ? 0.5 : 1,
                            }}
                            title="Delete Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Create User Modal */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, maxWidth: 480, width: '100%', padding: 28, color: '#f8fafc' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>Create New User Account</h3>
            <p style={{ fontSize: 13, opacity: 0.6, margin: '0 0 20px 0' }}>
              Super Admin privilege: Create Admin, Teacher, Student, or Super Admin accounts.
            </p>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, opacity: 0.8 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, opacity: 0.8 }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="admin@medhashine.com"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, opacity: 0.8 }}>Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, opacity: 0.8 }}>Assign Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff', fontSize: 13 }}
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  {user?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: '8px 20px', borderRadius: 8, background: '#38bdf8', color: '#0f172a', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, maxWidth: 440, width: '100%', padding: 24, color: '#f8fafc' }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: '#ef4444' }}>Delete Account Confirmation</h4>
            <p style={{ fontSize: 13, opacity: 0.8, margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete account for <strong>{deleteModalUser.name}</strong> ({deleteModalUser.email})? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                style={{ padding: '8px 20px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
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
