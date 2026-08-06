import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Shield, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Login failed.'); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault(); setForgotMsg({ text: '', type: '' });
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) { setForgotMsg({ text: 'Enter a valid email', type: 'error' }); return; }
    setForgotLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotMsg({ text: data.message || 'Code sent!', type: 'success' }); setStep(2);
    } catch (err) { setForgotMsg({ text: err.response?.data?.message || 'Failed to send code', type: 'error' }); }
    finally { setForgotLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setForgotMsg({ text: '', type: '' });
    if (!forgotOtp.trim() || !newPassword.trim()) { setForgotMsg({ text: 'Enter code and new password', type: 'error' }); return; }
    if (newPassword.length < 8) { setForgotMsg({ text: 'Password must be 8+ chars', type: 'error' }); return; }
    setForgotLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email: forgotEmail.trim(), otp: forgotOtp.trim(), newPassword: newPassword.trim() });
      setForgotMsg({ text: data.message || 'Password reset!', type: 'success' });
      setTimeout(() => { setForgotModalOpen(false); setEmail(forgotEmail.trim()); setStep(1); setForgotOtp(''); setNewPassword(''); }, 1500);
    } catch (err) { setForgotMsg({ text: err.response?.data?.message || 'Reset failed', type: 'error' }); }
    finally { setForgotLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-sky-500/25">
              M
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">Medhashine</span>
              <span className="ml-2 text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">Admin</span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-white text-center tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 text-center mt-1 mb-8">Sign in to access admin workspace</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3.5 mb-6 font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                <Mail size={13} /> Email address
              </label>
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@medhashine.com"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <Lock size={13} /> Password
                </label>
                <button type="button" onClick={() => { setForgotEmail(email); setForgotModalOpen(true); }}
                  className="text-xs text-sky-400 font-semibold hover:text-sky-300 cursor-pointer bg-transparent border-none p-0">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input id="password" type={showPass ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer bg-transparent border-none p-1">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 text-slate-950 text-sm font-bold hover:bg-sky-400 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/25 cursor-pointer mt-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> Signing in…</>
              ) : (
                <><Shield size={15} /> Sign in</>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6 leading-relaxed">
            Direct Admin Account Registration is restricted.<br />Contact Super Admin for credentials.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-5">
              <KeyRound size={20} className="text-sky-400" />
              <h3 className="text-lg font-bold text-white">Reset Admin Password</h3>
            </div>

            {forgotMsg.text && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${forgotMsg.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border border-red-500/30 text-red-400'}`}>
                {forgotMsg.text}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-sm text-slate-400">Enter your admin email to receive a 6-digit verification code.</p>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Admin Email</label>
                  <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="admin@medhashine.com"
                    className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setForgotModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit" disabled={forgotLoading} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-slate-950 text-sm font-bold cursor-pointer hover:bg-sky-400 disabled:opacity-40 transition-all">
                    {forgotLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-slate-400">Code sent to <strong className="text-white">{forgotEmail}</strong>.</p>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">6-Digit Code</label>
                  <input type="text" required maxLength={6} value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} placeholder="123456"
                    className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm tracking-[0.2em] focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">New Password</label>
                  <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters"
                    className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white cursor-pointer bg-transparent border-none">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" disabled={forgotLoading} className="px-5 py-2.5 rounded-lg bg-sky-500 text-slate-950 text-sm font-bold cursor-pointer hover:bg-sky-400 disabled:opacity-40 transition-all">
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
