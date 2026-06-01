import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import ApiStatusBanner from './ApiStatusBanner';

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="fixed top-0 left-0 right-0 z-50 lg:col-span-2">
        <ApiStatusBanner />
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-950 via-slate-900 to-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(51,128,255,0.25),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.2),transparent_50%)]" />
        <Link to="/" className="relative flex items-center gap-2 text-xl font-bold">
          <BookOpen className="h-8 w-8 text-brand-400" />
          <span className="gradient-text">Osarthi</span>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-brand-200 mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Trusted by educators
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
            Learn smarter.
            <br />
            <span className="gradient-text">Teach better.</span>
          </h1>
          <p className="mt-6 max-w-md text-slate-400 leading-relaxed">
            Join Osarthi as a student or teacher. Create rich lessons, take timed quizzes, and grow with a platform built for modern classrooms.
          </p>
        </motion.div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} Osarthi EdTech</p>
      </div>

      <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-16">
        <Link to="/" className="mb-8 flex items-center gap-2 font-bold lg:hidden">
          <BookOpen className="h-7 w-7 text-brand-400" />
          <span className="gradient-text">Osarthi</span>
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
