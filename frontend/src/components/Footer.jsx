import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-lg mb-3">
              <BookOpen className="h-6 w-6 text-brand-400" />
              <span className="gradient-text">Osarthi</span>
            </div>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed">
              Empowering educators and learners with structured content, rich highlighting, and intelligent quizzes — built for the next generation of education.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/get-started" className="hover:text-white transition">Get Started</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Sign In</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-slate-500">© {new Date().getFullYear()} Osarthi EdTech. All rights reserved.</p>
      </div>
    </footer>
  );
}
