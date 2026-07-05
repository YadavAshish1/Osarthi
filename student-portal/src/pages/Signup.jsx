import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Mail,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

import { getApiRoot } from '../config/api';

const STEPS = { ROLE: 1, ACCOUNT: 2 };

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pendingRole, selectRole, register, oauthRegister } = useAuth();

  const oauthMode = searchParams.get('oauth') === '1';
  const oauthEmail = searchParams.get('email') || '';
  const oauthName = searchParams.get('name') || '';
  const oauthGoogleId = searchParams.get('googleId') || '';

  const initialRole = searchParams.get('role') || pendingRole || null;
  const [step, setStep] = useState(() => {
    const hasRole = !!(searchParams.get('role') || pendingRole);
    if (oauthMode) return hasRole ? STEPS.ACCOUNT : STEPS.ROLE;
    return hasRole ? STEPS.ACCOUNT : STEPS.ROLE;
  });
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState(oauthName);
  const [email, setEmail] = useState(oauthEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [classId, setClassId] = useState('');
  const [className, setClassName] = useState('');
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      selectRole(initialRole);
    }
  }, [initialRole, selectRole]);

  useEffect(() => {
    if (step === STEPS.ACCOUNT && role === 'student') {
      setLoadingClasses(true);
      api
        .get('/taxonomy/classes/public')
        .then((r) => setClasses(r.data))
        .catch(() => setClasses([]))
        .finally(() => setLoadingClasses(false));
    }
  }, [step, role]);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { score, label: labels[score] };
  }, [password]);

  const pickRole = (r) => {
    setRole(r);
    selectRole(r);
    setStep(STEPS.ACCOUNT);
    setError('');
  };

  const goBack = () => {
    setStep(STEPS.ROLE);
    setError('');
  };

  const validateAccount = () => {
    if (!name.trim()) return 'Full name is required';
    if (!email.trim()) return 'Email is required';
    if (!oauthMode) {
      if (password.length < 8) return 'Password must be at least 8 characters';
      if (password !== confirmPassword) return 'Passwords do not match';
    }
    if (role === 'student' && !classId && !className.trim()) {
      return 'Please select or enter your class';
    }
    if (!agreed) return 'Please accept the terms to continue';
    return null;
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    const validationError = validateAccount();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (oauthMode) {
        const user = await oauthRegister({
          name: name.trim(),
          email: email.trim(),
          role,
          classId: role === 'student' ? classId || undefined : undefined,
          className: role === 'student' && !classId ? className.trim() : undefined,
          googleId: oauthGoogleId,
        });
        navigate(user.role === 'teacher' ? '/teacher' : '/student');
        return;
      }
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        classId: role === 'student' ? classId || undefined : undefined,
        className: role === 'student' && !classId ? className.trim() : undefined,
      });
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign up failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const googleHref = role
    ? `${getApiRoot('/api/auth/google')}?role=${role}`
    : null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium text-brand-400">
          Step {step} of 2
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {step === STEPS.ROLE ? 'Are you a student or teacher?' : 'Create your account'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {step === STEPS.ROLE
            ? 'Choose your role so we can set up the right experience for you.'
            : role === 'teacher'
              ? 'Teachers can create classes, subjects, lessons, and quizzes.'
              : 'Students can read class content and attempt quizzes for their class.'}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {[STEPS.ROLE, STEPS.ACCOUNT].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition ${step >= s ? 'bg-brand-500' : 'bg-white/10'}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === STEPS.ROLE && (
          <motion.div
            key="role"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="space-y-4"
          >
            <button
              type="button"
              onClick={() => pickRole('student')}
              className="group flex w-full items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-brand-500/50 hover:bg-brand-500/5"
            >
              <div className="rounded-xl bg-brand-500/20 p-3 group-hover:bg-brand-500/30">
                <GraduationCap className="h-7 w-7 text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-lg">I&apos;m a Student</p>
                <p className="mt-1 text-sm text-slate-400">
                  Read lessons, attempt quizzes, and track your results.
                </p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-slate-500 group-hover:text-brand-400" />
            </button>

            <button
              type="button"
              onClick={() => pickRole('teacher')}
              className="group flex w-full items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-accent-500/50 hover:bg-accent-500/5"
            >
              <div className="rounded-xl bg-accent-500/20 p-3 group-hover:bg-accent-500/30">
                <UserCircle className="h-7 w-7 text-accent-400" />
              </div>
              <div>
                <p className="font-semibold text-lg">I&apos;m a Teacher</p>
                <p className="mt-1 text-sm text-slate-400">
                  Create content, highlight text, build quizzes, and manage classes.
                </p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-slate-500 group-hover:text-accent-400" />
            </button>

            <p className="pt-4 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-brand-400 hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {step === STEPS.ACCOUNT && (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
          >
            {!oauthMode && (
              <button
                type="button"
                onClick={goBack}
                className="mb-6 flex items-center gap-1 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Change role
              </button>
            )}

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm capitalize">
              {role === 'student' ? (
                <GraduationCap className="h-4 w-4 text-brand-400" />
              ) : (
                <UserCircle className="h-4 w-4 text-accent-400" />
              )}
              Signing up as <strong className="text-white">{role}</strong>
            </div>

            {!oauthMode && (
              <>
                {googleHref ? (
                  <a
                    href={googleHref}
                    className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium transition hover:bg-white/10"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </a>
                ) : null}

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-950 px-3 text-slate-500">Or sign up with email</span>
                  </div>
                </div>
              </>
            )}

            {oauthMode && (
              <div className="mb-6 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
                Complete your profile with Google. Select your role details below.
              </div>
            )}

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Full name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  disabled={oauthMode && !!oauthName}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.com"
                    required
                    disabled={oauthMode && !!oauthEmail}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 py-3 pl-11 pr-4 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
                  />
                </div>
              </div>

              {!oauthMode && (
                <>
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 pr-11 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {password && (
                      <p className={`mt-1.5 text-xs ${passwordStrength.score >= 3 ? 'text-green-400' : 'text-amber-400'}`}>
                        Strength: {passwordStrength.label}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-300">
                      Confirm password
                    </label>
                    <input
                      id="confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                    />
                    {confirmPassword && password === confirmPassword && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-green-400">
                        <Check className="h-3.5 w-3.5" /> Passwords match
                      </p>
                    )}
                  </div>
                </>
              )}

              {role === 'student' && (
                <div>
                  <label htmlFor="class" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Your class
                  </label>
                  {loadingClasses ? (
                    <p className="text-sm text-slate-500">Loading classes…</p>
                  ) : classes.length > 0 ? (
                    <select
                      id="class"
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 outline-none focus:border-brand-500/50"
                    >
                      <option value="">Select your class</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <input
                        id="class"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="Enter your class name (e.g. Class 10A)"
                        required
                        className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 outline-none focus:border-brand-500/50"
                      />
                      <p className="text-xs text-amber-200/90">
                        Your teacher must create this class first. Or{' '}
                        <button
                          type="button"
                          onClick={() => {
                            selectRole('teacher');
                            setRole('teacher');
                            setStep(STEPS.ACCOUNT);
                          }}
                          className="text-brand-300 underline"
                        >
                          sign up as teacher
                        </button>
                        .
                      </p>
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 rounded border-white/20"
                />
                <span className="text-sm text-slate-400">
                  I agree to Osarthi&apos;s{' '}
                  <Link to="/about" className="text-brand-400 hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link to="/contact" className="text-brand-400 hover:underline">Privacy Policy</Link>
                </span>
              </label>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Creating account…
                  </>
                ) : (
                  <>
                    Create account <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-brand-400 hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
