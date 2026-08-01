"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, User as UserIcon, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const { user, logout, openAuth } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
            className={`hover:text-[#A84C32] transition-colors ${
              pathname === "/" ? "font-semibold text-[#A84C32]" : ""
            }`}
          >
            Home
          </Link>
          <Link
            data-testid="nav-about"
            href="/about"
            className={`hover:text-[#A84C32] transition-colors ${
              pathname === "/about" ? "font-semibold text-[#A84C32]" : ""
            }`}
          >
            About
          </Link>
          <Link
            data-testid="nav-contact"
            href="/contact"
            className={`hover:text-[#A84C32] transition-colors ${
              pathname === "/contact" ? "font-semibold text-[#A84C32]" : ""
            }`}
          >
            Contact
          </Link>

          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-[#E5E1D8]">
              <span
                className="flex items-center gap-2 text-[#1A1A1A]"
                data-testid="header-user-name"
              >
                <UserIcon className="h-4 w-4 text-[#A84C32]" />
                <span className="font-medium">{user.name}</span>
              </span>
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
                <span className="font-medium text-[#1A1A1A] flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-[#A84C32]" />
                  {user.name}
                </span>
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
