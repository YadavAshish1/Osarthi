import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    try { await register(name, email, password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-sky-500/25">M</div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">Medhashine</span>
              <span className="ml-2 text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">Admin</span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-white text-center tracking-tight">Create admin account</h1>
          <p className="text-sm text-slate-500 text-center mt-1 mb-8">Set up your account to manage site settings</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3.5 mb-6 font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2"><User size={13} /> Full name</label>
              <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
            </div>

            <div>
              <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2"><Mail size={13} /> Email address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@medhashine.com"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
            </div>

            <div>
              <label htmlFor="password" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2"><Lock size={13} /> Password</label>
              <div className="relative">
                <input id="password" type={showPass ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters"
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
                <><div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> Creating…</>
              ) : (
                <><ShieldCheck size={15} /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account? <Link to="/login" className="text-sky-400 font-semibold hover:text-sky-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
