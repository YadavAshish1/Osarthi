import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, BookOpen, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const homePath = user?.role === 'teacher' ? '/teacher' : user?.role === 'student' ? '/student' : '/';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to={homePath} className="flex items-center gap-2 font-bold text-xl">
          <BookOpen className="h-7 w-7 text-brand-400" />
          <span className="gradient-text">Osarthi</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/about" className="text-slate-300 hover:text-white transition">About</NavLink>
          <NavLink to="/contact" className="text-slate-300 hover:text-white transition">Contact</NavLink>
          {isAuthenticated ? (
            <>
              <Link to={homePath} className="text-slate-300 hover:text-white transition">Dashboard</Link>
              {user?.role === 'student' && (
                <Link to="/student/notifications" className="text-slate-300 hover:text-white transition flex items-center gap-1">
                  <Bell className="h-4 w-4" /> Notifications
                </Link>
              )}
              <button onClick={logout} className="flex items-center gap-1 text-slate-300 hover:text-white transition">
                <LogOut className="h-4 w-4" /> Logout
              </button>
              <span className="rounded-full bg-brand-600/30 px-3 py-1 text-sm text-brand-200 capitalize">{user?.role}</span>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white transition">Login</Link>
              <Link to="/get-started" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold hover:bg-brand-500 transition">
                Get Started
              </Link>
            </>
          )}
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/10 px-4 py-4 md:hidden flex flex-col gap-3">
          <NavLink to="/about" onClick={() => setOpen(false)}>About</NavLink>
          <NavLink to="/contact" onClick={() => setOpen(false)}>Contact</NavLink>
          {isAuthenticated ? (
            <>
              <Link to={homePath} onClick={() => setOpen(false)}>Dashboard</Link>
              <button onClick={() => { logout(); setOpen(false); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
              <Link to="/get-started" onClick={() => setOpen(false)}>Get Started</Link>
            </>
          )}
        </motion.div>
      )}
    </header>
  );
}
