import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Register() {
  const { pendingRole, register, clearPendingRole } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pendingRole) navigate('/get-started');
    if (pendingRole === 'student') {
      api.get('/taxonomy/classes/public').then((r) => setClasses(r.data));
    }
  }, [pendingRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await register({
        name,
        email,
        password,
        role: pendingRole,
        classId: pendingRole === 'student' ? classId : undefined,
      });
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Create your account</h1>
      <p className="text-slate-400 mb-2 text-sm capitalize">Signing up as {pendingRole}</p>
      <button type="button" onClick={() => { clearPendingRole(); navigate('/get-started'); }} className="text-sm text-brand-400 mb-6 hover:underline">Change role</button>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 chars)" required minLength={8} className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" />
        {pendingRole === 'student' && (
          <select value={classId} onChange={(e) => setClassId(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3">
            <option value="">Select your class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded-full bg-brand-600 py-3 font-semibold hover:bg-brand-500">Create account</button>
      </form>
      <a href={`${API_BASE}/api/auth/google?role=${pendingRole}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm hover:bg-white/5">
        Sign up with Google
      </a>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
