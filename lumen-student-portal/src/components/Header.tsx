"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  PenSquare,
  Clock,
  Award,
  LayoutDashboard,
  Eye,
  Home,
  BookOpen,
  Users,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, getTeacherSlug } from "@/lib/api";
import { trackSearch } from "@/lib/gtag";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import NotificationBell from "@/components/NotificationBell";
import UserDropdownMenu from "@/components/common/UserDropdownMenu";

export default function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const { user, ready, logout, openAuth } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [teacherStatus, setTeacherStatus] = useState<"none" | "pending" | "approved">("none");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Global Command/Ctrl + K shortcut to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  // Support ?auth=login or ?auth=register query param
  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (authParam === "login" && !user) {
      openAuth("login");
    } else if (authParam === "register" && !user) {
      openAuth("register");
    }
  }, [searchParams, user, openAuth]);

  useEffect(() => {
    if (!user) {
      setTeacherStatus("none");
      return;
    }

    if (["teacher", "admin", "super_admin"].includes(user.role || "")) {
      setTeacherStatus("approved");
      return;
    }

    api
      .get("/teacher-applications/my-status")
      .then(({ data }) => {
        const app = data?.application;
        if (app?.status === "approved") {
          setTeacherStatus("approved");
        } else if (app?.status === "pending") {
          setTeacherStatus("pending");
        } else {
          setTeacherStatus("none");
        }
      })
      .catch(() => {
        if (["teacher", "admin", "super_admin"].includes(user.role || "")) {
          setTeacherStatus("approved");
        } else {
          setTeacherStatus("none");
        }
      });
  }, [user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      trackSearch(q.trim());
    }
    // Always redirect to /insights for search
    router.push(`/insights?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header
        data-testid="site-header"
        className="sticky top-0 z-50 backdrop-blur-xl bg-[#FAF8F5]/95 border-b border-[#E5E1D8] transition-all"
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 lg:gap-4 xl:gap-6 h-16">
        {/* Left: Brand Logo & LinkedIn-style Search Trigger */}
        <div className="flex items-center gap-2.5 lg:gap-4 shrink-0">
          <Link
            href="/"
            data-testid="logo-link"
            className="flex items-center gap-2 shrink-0 group py-1"
          >
            <span className="font-serif-display text-2xl lg:text-[28px] font-semibold tracking-tight text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors whitespace-nowrap">
              Medhashine
            </span>
          </Link>

          {/* Desktop Compact Search Trigger */}
          <div
            data-testid="global-search-trigger"
            onClick={() => setSearchModalOpen(true)}
            className="hidden md:flex items-center w-36 lg:w-44 xl:w-56 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSearchModalOpen(true);
              }
            }}
            aria-label="Search insights, teachers, and topics"
          >
            <div className="relative w-full flex items-center pl-8 pr-2 h-9 rounded-full bg-white/90 border border-[#E5E1D8] group-hover:border-[#A84C32] group-hover:bg-white transition-all shadow-2xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5C5A55] group-hover:text-[#A84C32] transition-colors" />
              <span className="font-ui text-xs text-[#5C5A55]/70 truncate select-none">
                Search insights…
              </span>
              <kbd className="hidden xl:inline-flex ml-auto items-center px-1.5 py-0.5 text-[9px] font-mono font-medium text-[#5C5A55] bg-[#FAF8F5] border border-[#E5E1D8] rounded shadow-2xs group-hover:border-[#A84C32]/40">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Center: Core Nav Destinations */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1.5 xl:gap-2 font-ui text-xs lg:text-[13px] shrink-0">
          <Link
            data-testid="nav-home"
            href="/"
            className={`px-2.5 lg:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
              pathname === "/"
                ? "text-[#A84C32] font-semibold bg-[#A84C32]/8"
                : "text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-black/[0.03]"
            }`}
          >
            Home
          </Link>
          <Link
            data-testid="nav-insights"
            href="/insights"
            className={`px-2.5 lg:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
              pathname.startsWith("/insights")
                ? "text-[#A84C32] font-semibold bg-[#A84C32]/8"
                : "text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-black/[0.03]"
            }`}
          >
            Insights
          </Link>
          <Link
            data-testid="nav-teachers"
            href="/teachers"
            className={`px-2.5 lg:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
              pathname.startsWith("/teachers")
                ? "text-[#A84C32] font-semibold bg-[#A84C32]/8"
                : "text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-black/[0.03]"
            }`}
          >
            Find Teachers
          </Link>
          <Link
            data-testid="nav-about"
            href="/about"
            className={`hidden xl:inline-block px-2.5 lg:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
              pathname === "/about"
                ? "text-[#A84C32] font-semibold bg-[#A84C32]/8"
                : "text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-black/[0.03]"
            }`}
          >
            About
          </Link>
          <Link
            data-testid="nav-contact"
            href="/contact"
            className={`hidden xl:inline-block px-2.5 lg:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
              pathname === "/contact"
                ? "text-[#A84C32] font-semibold bg-[#A84C32]/8"
                : "text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-black/[0.03]"
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Right: Actions, Notifications & LinkedIn-Style "Me" Profile Menu */}
        <div className="hidden md:flex items-center gap-2 lg:gap-2.5 shrink-0">
          {mounted && ready && user ? (
            <div
              suppressHydrationWarning
              className="flex items-center gap-2 lg:gap-2.5 shrink-0"
            >
              {teacherStatus === "approved" && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/teacher/write"
                    className="px-3 lg:px-3.5 py-1.5 rounded-full bg-[#A84C32] text-white hover:bg-[#8C3A27] transition-all font-medium text-xs flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                    title="Write New Insight"
                  >
                    <PenSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Write Insight</span>
                  </Link>
                </div>
              )}

              {teacherStatus === "pending" && (
                <Link
                  href="/profile"
                  className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px] flex items-center gap-1 hover:bg-amber-100 transition-colors whitespace-nowrap"
                >
                  <Clock className="h-3 w-3" />
                  <span>Pending</span>
                </Link>
              )}

              {teacherStatus === "none" && user.role !== "teacher" && (
                <Link
                  href="/become-a-teacher"
                  className="hidden lg:inline-flex px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors font-medium text-xs items-center gap-1 whitespace-nowrap"
                >
                  <span>Become a Teacher</span>
                </Link>
              )}

              <NotificationBell />

              <div className="h-5 w-[1px] bg-[#E5E1D8] mx-0.5" />

              <UserDropdownMenu
                user={user}
                onLogout={() => logout()}
                teacherStatus={teacherStatus}
              />
            </div>
          ) : (
            <div
              suppressHydrationWarning
              className="flex items-center gap-2.5 shrink-0"
            >
              <button
                onClick={() => openAuth("login")}
                data-testid="open-auth-button"
                className="px-4 py-1.5 lg:px-5 lg:py-2 rounded-full bg-[#A84C32] text-white hover:bg-[#8B3A25] transition-all font-medium text-xs lg:text-sm cursor-pointer whitespace-nowrap shadow-2xs"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Mobile Search & Menu Toggle */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-2 text-[#1A1A1A] hover:text-[#A84C32] rounded-full transition-colors"
            aria-label="Open search"
          >
            <Search className="h-5 w-5 text-[#1A1A1A]" />
          </button>
          {mounted && ready && user && (
            <NotificationBell />
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-[#1A1A1A] hover:text-[#A84C32]"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Premium Luxury Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#E5E1D8] bg-[#FAF8F5] px-4 py-5 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-4.5rem)] overflow-y-auto font-ui">
          {/* 1. Logged-in User Profile Card at Top */}
          {mounted && ready && user ? (
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E1D8] shadow-2xs flex items-center justify-between gap-3">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 min-w-0 flex-1 group"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-11 h-11 rounded-xl object-cover border border-[#E5E1D8] shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                    {user.name?.[0] || "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-serif-display text-sm font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors truncate">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {user.role === "teacher" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>Verified Teacher</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#5C5A55] truncate block">
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                title="Sign out"
                className="p-2 rounded-xl text-[#5C5A55] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Guest Welcome & Sign In Prompt Card */
            <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] shadow-2xs flex items-center justify-between gap-3">
              <div>
                <p className="font-serif-display text-sm font-semibold text-[#1A1A1A]">
                  Welcome to Medhashine
                </p>
                <p className="text-[11px] text-[#5C5A55] mt-0.5">
                  Sign in to save insights & test knowledge
                </p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  openAuth("login");
                }}
                className="px-4 py-2 rounded-full bg-[#A84C32] text-white hover:bg-[#8C3A27] transition-colors text-xs font-semibold shadow-2xs shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}

          {/* 2. Global Search Pill */}
          <div
            onClick={() => {
              setMenuOpen(false);
              setSearchModalOpen(true);
            }}
            className="w-full cursor-pointer group"
          >
            <div className="relative w-full flex items-center pl-10 pr-4 h-10 rounded-full bg-white border border-[#E5E1D8] group-hover:border-[#A84C32] transition-all text-xs text-[#5C5A55]/80 shadow-2xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5A55] group-hover:text-[#A84C32] transition-colors" />
              <span>Search insights, teachers, topics…</span>
            </div>
          </div>

          {/* 3. Educator Studio Card (for Verified Teachers) */}
          {mounted && ready && teacherStatus === "approved" && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white to-[#FAF8F5] border border-[#A84C32]/30 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A84C32] flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#A84C32]" />
                  <span>Educator Studio</span>
                </span>
                {user && (
                  <Link
                    href={`/teachers/${getTeacherSlug(user.id, user.name)}`}
                    onClick={() => setMenuOpen(false)}
                    className="text-[11px] font-semibold text-[#5C5A55] hover:text-[#A84C32] flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Public Profile</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/teacher/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs text-center"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-[#A84C32]" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/teacher/write"
                  onClick={() => setMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-[#A84C32] text-white hover:bg-[#8C3A27] transition-colors font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs text-center"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>Write Insight</span>
                </Link>
              </div>
            </div>
          )}

          {/* Teacher Application Pending Status */}
          {mounted && ready && teacherStatus === "pending" && (
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="w-full py-2.5 px-4 rounded-2xl bg-amber-50 text-amber-900 border border-amber-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs"
            >
              <Clock className="h-3.5 w-3.5 text-amber-700" />
              <span>Teacher Application Pending Approval</span>
            </Link>
          )}

          {/* Become a Teacher Promo (Guests / Students) */}
          {(!mounted || !ready || !user || (teacherStatus === "none" && user.role !== "teacher")) && (
            <Link
              href="/become-a-teacher"
              onClick={() => setMenuOpen(false)}
              className="w-full p-3 rounded-2xl bg-white border border-[#E5E1D8] hover:border-[#A84C32] transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] text-[#A84C32] flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors">
                    Become a Teacher
                  </p>
                  <p className="text-[10px] text-[#5C5A55]">
                    Share your knowledge with curious minds
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#5C5A55] group-hover:text-[#A84C32] group-hover:translate-x-0.5 transition-all" />
            </Link>
          )}

          {/* 4. Main Navigation Links (Clean Grouped Card with Icons & Active Indicator) */}
          <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-2xs overflow-hidden divide-y divide-[#E5E1D8]/60">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 text-xs transition-colors ${
                pathname === "/"
                  ? "bg-[#FAF8F5] font-semibold text-[#A84C32]"
                  : "text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className={`h-4 w-4 ${pathname === "/" ? "text-[#A84C32]" : "text-[#5C5A55]"}`} />
                <span>Home</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#5C5A55]/50" />
            </Link>

            <Link
              href="/insights"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 text-xs transition-colors ${
                pathname === "/insights"
                  ? "bg-[#FAF8F5] font-semibold text-[#A84C32]"
                  : "text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className={`h-4 w-4 ${pathname === "/insights" ? "text-[#A84C32]" : "text-[#5C5A55]"}`} />
                <span>Insights</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#5C5A55]/50" />
            </Link>

            <Link
              href="/teachers"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 text-xs transition-colors ${
                pathname.startsWith("/teachers")
                  ? "bg-[#FAF8F5] font-semibold text-[#A84C32]"
                  : "text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`h-4 w-4 ${pathname.startsWith("/teachers") ? "text-[#A84C32]" : "text-[#5C5A55]"}`} />
                <span>Find Teachers</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#5C5A55]/50" />
            </Link>

            {/* Quiz History Link for all logged-in members */}
            {mounted && ready && user && (
              <Link
                href="/quiz/history"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 text-xs transition-colors ${
                  pathname === "/quiz/history"
                    ? "bg-[#FAF8F5] font-semibold text-[#A84C32]"
                    : "text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-[#A84C32]" />
                  <span>My Quiz History</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#A84C32] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E5E1D8]">
                  Results
                </span>
              </Link>
            )}
          </div>

          {/* 5. Secondary Footer Links (About, Contact, Help) */}
          <div className="pt-2 pb-1 flex items-center justify-center gap-4 text-xs font-medium text-[#5C5A55]">
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className={`hover:text-[#A84C32] transition-colors ${pathname === "/about" ? "font-semibold text-[#A84C32]" : ""}`}
            >
              About
            </Link>
            <span className="text-[#E5E1D8]">•</span>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className={`hover:text-[#A84C32] transition-colors ${pathname === "/contact" ? "font-semibold text-[#A84C32]" : ""}`}
            >
              Contact
            </Link>
            <span className="text-[#E5E1D8]">•</span>
            <Link
              href="/help"
              onClick={() => setMenuOpen(false)}
              className={`hover:text-[#A84C32] transition-colors ${pathname === "/help" ? "font-semibold text-[#A84C32]" : ""}`}
            >
              Help Center
            </Link>
          </div>
        </div>
      )}

      </header>

      {/* Luxury Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        initialQuery={q}
      />
    </>
  );
}
