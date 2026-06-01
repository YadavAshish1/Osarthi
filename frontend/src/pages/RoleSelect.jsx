import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoleSelect() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const choose = (role) => {
    selectRole(role);
    navigate('/signup');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3">Who are you?</h1>
        <p className="text-slate-400">Choose your role to personalize your Osarthi experience.</p>
      </motion.div>
      <div className="grid gap-6 sm:grid-cols-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => choose('student')}
          className="glass rounded-2xl p-10 text-left hover:border-brand-500/50 transition group"
        >
          <GraduationCap className="h-12 w-12 text-brand-400 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-xl font-bold mb-2">I&apos;m a Student</h2>
          <p className="text-sm text-slate-400">Access lessons, take quizzes, and track your progress.</p>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => choose('teacher')}
          className="glass rounded-2xl p-10 text-left hover:border-accent-500/50 transition group"
        >
          <UserCircle className="h-12 w-12 text-accent-400 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-xl font-bold mb-2">I&apos;m a Teacher</h2>
          <p className="text-sm text-slate-400">Create content, build quizzes, and manage your classes.</p>
        </motion.button>
      </div>
      <p className="mt-10 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:underline">Login</Link>
      </p>
    </div>
  );
}
