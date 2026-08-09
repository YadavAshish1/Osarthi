"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, User as UserIcon, LogOut, Menu, X, PenSquare, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const { user, logout, openAuth } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [teacherStatus, setTeacherStatus] = useState<"none" | "pending" | "approved">("none");

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
      .catch(() => setTeacherStatus("none"));
  }, [user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pathname !== "/") {
      router.push(`/?q=${encodeURIComponent(q)}`);
    } else if (onSearch) {
      onSearch(q);
    } else {
      router.push(`/?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-50 backdrop-blur-xl bg-[#FAF8F5]/90 border-b border-[#E5E1D8]"
    >
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 flex items-center justify-between gap-6 h-16 md:h-20">
        <Link
          href="/"
          data-testid="logo-link"
          className="flex items-center gap-2 shrink-0 group"
        >
          <span className="font-serif-display text-2xl md:text-3xl font-semibold tracking-tight text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors">
            Medhashine
          </span>
          <span className="hidden sm:inline eyebrow text-[#A84C32]">
            / Student
          </span>
        </Link>

        <form onSubmit={submit} className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5A55]" />
            <input
              data-testid="global-search-input"
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search insights, teachers, topics…"
              className="w-full pl-11 pr-4 h-11 rounded-full bg-white border border-[#E5E1D8] font-ui text-sm placeholder:text-[#5C5A55]/70 focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32] transition-colors"
            />
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-8 font-ui text-sm text-[#1A1A1A]">
          <Link
            data-testid="nav-home"
            href="/"
            className={`hover:text-[#A84C32] transition-colors ${pathname === "/" ? "font-semibold text-[#A84C32]" : ""
              }`}
          >
            Home
          </Link>
          <Link
            data-testid="nav-teachers"
            href="/teachers"
            className={`hover:text-[#A84C32] transition-colors flex items-center gap-1.5 ${pathname.startsWith("/teachers") ? "font-semibold text-[#A84C32]" : ""
              }`}
          >
            Find Teachers
          </Link>
          <Link
            data-testid="nav-about"
            href="/about"
            className={`hover:text-[#A84C32] transition-colors ${pathname === "/about" ? "font-semibold text-[#A84C32]" : ""
              }`}
          >
            About
          </Link>
          <Link
            data-testid="nav-contact"
            href="/contact"
            className={`hover:text-[#A84C32] transition-colors ${pathname === "/contact" ? "font-semibold text-[#A84C32]" : ""
              }`}
          >
            Contact
          </Link>
          <Link
            data-testid="nav-help"
            href="/help"
            className={`hover:text-[#A84C32] transition-colors ${pathname === "/help" ? "font-semibold text-[#A84C32]" : ""
              }`}
          >
            Help Center
          </Link>

          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-[#E5E1D8]">
              {teacherStatus === "approved" && (
                <Link
                  href="/teacher/write"
                  className="px-4 py-2 rounded-full bg-[#A84C32] text-white hover:bg-[#8C3A27] transition-colors font-medium text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>Write Insight</span>
                </Link>
              )}

              {teacherStatus === "pending" && (
                <Link
                  href="/profile"
                  className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-[11px] flex items-center gap-1 hover:bg-amber-200 transition-colors"
                >
                  <Clock className="h-3 w-3" />
                  <span>Pending Approval</span>
                </Link>
              )}

              {teacherStatus === "none" && user.role !== "teacher" && (
                <Link
                  href="/become-a-teacher"
                  className="px-3.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors font-medium text-xs flex items-center gap-1"
                >
                  <span>Become a Teacher</span>
                </Link>
              )}

              <Link
                href="/profile"
                className="flex items-center gap-2.5 text-[#1A1A1A] hover:text-[#A84C32] transition-colors"
                data-testid="header-user-name"
                title="View Profile & Saved Insights"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#E5E1D8] shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#A84C32] border border-[#E5E1D8] flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
                <span className="font-medium">{user.name}</span>
              </Link>
              <button
                onClick={() => logout()}
                data-testid="logout-button"
                className="flex items-center gap-1.5 text-[#5C5A55] hover:text-[#A84C32] transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-4 border-l border-[#E5E1D8]">
              <button
                onClick={() => openAuth("login")}
                data-testid="open-auth-button"
                className="px-5 py-2.5 rounded-full bg-[#1A1A1A] text-white hover:bg-[#A84C32] transition-colors font-medium cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-[#1A1A1A] hover:text-[#A84C32]"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#E5E1D8] bg-[#FAF8F5] px-6 py-6 space-y-4">
          <form onSubmit={submit} className="w-full mb-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5A55]" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search insights, teachers, topics…"
                className="w-full pl-11 pr-4 h-10 rounded-full bg-white border border-[#E5E1D8] font-ui text-sm focus:outline-none"
              />
            </div>
          </form>
          <div className="flex flex-col space-y-3 font-ui text-base">
            <Link
              href="/"
              className="py-1 text-[#1A1A1A] hover:text-[#A84C32]"
            >
              Home
            </Link>
            <Link
              href="/teachers"
              className="py-1 font-medium text-[#A84C32] hover:text-[#1A1A1A]"
            >
              Find Teachers
            </Link>
            <Link
              href="/about"
              className="py-1 text-[#1A1A1A] hover:text-[#A84C32]"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="py-1 text-[#1A1A1A] hover:text-[#A84C32]"
            >
              Contact
            </Link>
            {user ? (
              <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between">
                <Link
                  href="/profile"
                  className="font-medium text-[#1A1A1A] hover:text-[#A84C32] flex items-center gap-2.5"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-[#E5E1D8] shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#A84C32] border border-[#E5E1D8] flex items-center justify-center shrink-0">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                  {user.name}
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-sm text-[#A84C32] font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuth("login")}
                className="mt-2 w-full py-3 rounded-full bg-[#1A1A1A] text-white font-medium text-center"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
