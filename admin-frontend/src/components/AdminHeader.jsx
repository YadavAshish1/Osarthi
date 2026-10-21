import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ChevronDown,
  LayoutTemplate,
  BarChart3,
  Layers,
  Sparkles,
  Quote,
  Search,
  BookOpen,
  Send,
  Users,
  GraduationCap,
  LifeBuoy,
} from 'lucide-react';

export default function AdminHeader({ activePage }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Grouped Navigation Structure
  const navGroups = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      isDirect: true,
    },
    {
      id: 'cms-group',
      label: 'Home & CMS',
      icon: LayoutTemplate,
      childIds: ['home-settings', 'educator-cards', 'testimonials', 'seo'],
      items: [
        {
          id: 'home-settings',
          label: 'Platform Stats',
          description: 'Live numbers in StatsBar.tsx',
          path: '/home-settings',
          icon: BarChart3,
        },
        {
          id: 'home-banners',
          label: 'Hero Banners',
          description: 'Homepage top carousel slides',
          path: '/home-settings?tab=banners',
          icon: Layers,
        },
        {
          id: 'educator-cards',
          label: 'Educator Spotlight',
          description: 'Manage teacher spotlight cards',
          path: '/educator-cards',
          icon: Sparkles,
        },
        {
          id: 'testimonials',
          label: 'Student Reviews',
          description: 'Ratings & testimonials',
          path: '/testimonials',
          icon: Quote,
        },
        {
          id: 'seo',
          label: 'SEO & Search Meta',
          description: 'Google preview & site meta',
          path: '/dashboard',
          icon: Search,
        },
      ],
    },
    {
      id: 'curriculum-group',
      label: 'Curriculum',
      icon: BookOpen,
      childIds: ['taxonomy', 'taxonomy-requests'],
      items: [
        {
          id: 'taxonomy',
          label: 'Classes & Subjects',
          description: 'Grades, topics & chapters',
          path: '/taxonomy',
          icon: BookOpen,
        },
        {
          id: 'taxonomy-requests',
          label: 'Curriculum Requests',
          description: 'Educator taxonomy submissions',
          path: '/taxonomy-requests',
          icon: Send,
        },
      ],
    },
    {
      id: 'community-group',
      label: 'Members',
      icon: Users,
      childIds: ['users', 'applications'],
      items: [
        {
          id: 'users',
          label: 'Users Directory',
          description: 'All system accounts & roles',
          path: '/users',
          icon: Users,
        },
        {
          id: 'applications',
          label: 'Educator Applications',
          description: 'Teacher onboarding approvals',
          path: '/applications',
          icon: GraduationCap,
        },
      ],
    },
    {
      id: 'support-tickets',
      label: 'Support',
      path: '/support-tickets',
      icon: LifeBuoy,
      isDirect: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16" ref={navRef}>
          {/* Brand Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-sky-500/25">
              M
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-base tracking-tight">Medhashine</span>
              <span className="ml-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider">Admin</span>
            </div>
          </Link>

          {/* Desktop Navigation with Dropdowns */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navGroups.map((group) => {
              // Direct Link (Dashboard, Support)
              if (group.isDirect) {
                const isActive = activePage === group.id;
                const Icon = group.icon;
                return (
                  <Link
                    key={group.id}
                    to={group.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon size={14} />
                    {group.label}
                  </Link>
                );
              }

              // Dropdown Group (Home & CMS, Curriculum, Members)
              const isGroupActive = group.childIds.includes(activePage);
              const isOpen = openDropdown === group.id;
              const Icon = group.icon;

              return (
                <div key={group.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isGroupActive || isOpen
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon size={14} />
                    {group.label}
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-sky-400' : 'text-slate-500'}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 p-2 shadow-2xl z-50 animate-fade-in">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {group.label} Management
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        {group.items.map((item) => {
                          const isItemActive = activePage === item.id;
                          const ItemIcon = item.icon;
                          return (
                            <Link
                              key={item.id}
                              to={item.path}
                              onClick={() => setOpenDropdown(null)}
                              className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                                isItemActive
                                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  isItemActive
                                    ? 'bg-sky-500/20 text-sky-400'
                                    : 'bg-white/5 text-slate-400 group-hover:text-white'
                                }`}
                              >
                                <ItemIcon size={14} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold leading-tight">
                                  {item.label}
                                </span>
                                {item.description && (
                                  <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Section: User & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-white">
                {user?.name || user?.email || 'Admin'}
              </div>
              <div className="text-[10px] font-semibold mt-0.5">
                {user?.role === 'super_admin' ? (
                  <span className="text-red-400">Super Admin</span>
                ) : user?.role === 'admin' ? (
                  <span className="text-sky-400">Admin</span>
                ) : (
                  <span className="text-slate-400">{user?.role}</span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg border border-white/10 bg-white/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-6 pt-3 border-t border-white/10 mt-1 space-y-4">
            {navGroups.map((group) => {
              if (group.isDirect) {
                const isActive = activePage === group.id;
                const Icon = group.icon;
                return (
                  <Link
                    key={group.id}
                    to={group.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon size={16} />
                    {group.label}
                  </Link>
                );
              }

              return (
                <div key={group.id} className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <group.icon size={12} className="text-sky-400" />
                    {group.label}
                  </div>
                  <div className="flex flex-col gap-1 pl-2">
                    {group.items.map((item) => {
                      const isActive = activePage === item.id;
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <ItemIcon size={14} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
