import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, LayoutDashboard, Users, GraduationCap, Send, BookOpen, LifeBuoy } from 'lucide-react';

export default function AdminHeader({ activePage }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', path: '/users', icon: Users },
    { id: 'applications', label: 'Educators', path: '/applications', icon: GraduationCap },
    { id: 'taxonomy-requests', label: 'Requests', path: '/taxonomy-requests', icon: Send },
    { id: 'taxonomy', label: 'Classes & Subjects', path: '/taxonomy', icon: BookOpen },
    { id: 'support-tickets', label: 'Support Tickets', path: '/support-tickets', icon: LifeBuoy },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/85 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-sky-500/25">
              M
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-base tracking-tight">Medhashine</span>
              <span className="ml-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider">Admin</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side: User + Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-white flex items-center justify-end gap-1.5">
                {user?.name || user?.email || 'Admin'}
                {user?.role === 'super_admin' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold uppercase">
                    SA
                  </span>
                )}
              </div>
              <div className="text-[10px] text-sky-400 font-semibold uppercase">{user?.role}</div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg border border-white/10 bg-white/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 border-t border-white/5 mt-1">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
