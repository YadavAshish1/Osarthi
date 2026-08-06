import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Shield, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotMsg({ text: '', type: '' });
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotMsg({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }

    setForgotLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotMsg({ text: data.message || 'Verification code sent!', type: 'success' });
      setStep(2);
    } catch (err) {
      setForgotMsg({ text: err.response?.data?.message || 'Failed to send reset code', type: 'error' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotMsg({ text: '', type: '' });
    if (!forgotOtp.trim() || !newPassword.trim()) {
      setForgotMsg({ text: 'Please enter code and new password', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setForgotMsg({ text: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    setForgotLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: newPassword.trim(),
      });
      setForgotMsg({ text: data.message || 'Password reset successfully!', type: 'success' });
      setTimeout(() => {
        setForgotModalOpen(false);
        setEmail(forgotEmail.trim());
        setStep(1);
        setForgotOtp('');
        setNewPassword('');
      }, 1500);
    } catch (err) {
      setForgotMsg({ text: err.response?.data?.message || 'Reset failed', type: 'error' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">M</div>
          <span className="auth-logo-text">Medhashine</span>
          <span className="auth-logo-badge">ADMIN</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to access admin workspace</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              <Mail size={12} style={{ display: 'inline', marginRight: 5 }} />
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@medhashine.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">
                <Lock size={12} style={{ display: 'inline', marginRight: 5 }} />
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotModalOpen(true);
                }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 12, cursor: 'pointer', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><div className="spinner" /> Signing in…</> : <><Shield size={15} /> Sign in</>}
          </button>
        </form>

        <div className="auth-link" style={{ fontSize: 12, opacity: 0.7, marginTop: 20 }}>
          Direct Admin Account Registration is restricted. Contact Super Admin for credentials.
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, maxWidth: 440, width: '100%', padding: 28, color: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <KeyRound size={22} color="#38bdf8" />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Reset Admin Password</h3>
            </div>

            {forgotMsg.text && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
                background: forgotMsg.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: forgotMsg.type === 'success' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
                color: forgotMsg.type === 'success' ? '#4ade80' : '#fca5a5'
              }}>
                {forgotMsg.text}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp}>
                <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px 0' }}>
                  Enter your admin email address to receive a 6-digit verification reset code.
                </p>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Admin Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@medhashine.com"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{ padding: '8px 20px', borderRadius: 8, background: '#38bdf8', color: '#0f172a', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px 0' }}>
                  We sent a 6-digit code to <strong>{forgotEmail}</strong>. Enter the code and your new password.
                </p>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="e.g. 123456"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 13, letterSpacing: 2 }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{ padding: '8px 20px', borderRadius: 8, background: '#38bdf8', color: '#0f172a', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {forgotLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
