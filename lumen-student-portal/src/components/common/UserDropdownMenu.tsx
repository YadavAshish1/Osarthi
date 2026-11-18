"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  LayoutDashboard,
  PenSquare,
  Eye,
  Award,
  Bookmark,
  LogOut,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  Settings,
  Brain,
} from "lucide-react";
import { User } from "@/context/AuthContext";
import { getTeacherSlug } from "@/lib/api";

interface UserDropdownMenuProps {
  user: User;
  onLogout: () => void;
  teacherStatus?: "none" | "pending" | "approved";
}

export default function UserDropdownMenu({
  user,
  onLogout,
  teacherStatus = "none",
}: UserDropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isTeacher = user.role === "teacher" || teacherStatus === "approved";
  const teacherSlug = isTeacher ? getTeacherSlug(user.id, user.name) : "";
  const firstName = user.name ? user.name.trim().split(" ")[0] : "Me";

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button - LinkedIn-style Compact Profile Pill */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        title={`${user.name} (${isTeacher ? "Teacher" : "Student"})`}
        className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border transition-all cursor-pointer ${
          open
            ? "bg-[#FAF8F5] border-[#A84C32] shadow-xs ring-1 ring-[#A84C32]/20"
            : "bg-white/80 border-[#E5E1D8] hover:border-[#A84C32] hover:bg-[#FAF8F5]"
        }`}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-7 h-7 rounded-full object-cover border border-[#E5E1D8] shrink-0 shadow-2xs"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#A84C32] border border-[#E5E1D8] flex items-center justify-center font-bold text-xs shrink-0">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <span className="hidden lg:inline font-ui text-xs font-semibold text-[#1A1A1A] max-w-[80px] xl:max-w-[110px] truncate">
          {firstName}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[#5C5A55] transition-transform duration-200 ${
            open ? "rotate-180 text-[#A84C32]" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Panel */}
      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] origin-top-right rounded-2xl bg-white border border-[#E5E1D8] shadow-xl z-50 overflow-hidden font-ui animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Header Summary */}
          <div className="p-4 bg-[#FAF8F5] border-b border-[#E5E1D8]/80">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-xl object-cover border border-[#E5E1D8] shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center text-sm font-bold uppercase shrink-0">
                  {user.name?.[0] || "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-serif-display text-sm font-semibold text-[#1A1A1A] truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-[#5C5A55] truncate">{user.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {isTeacher ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span>Verified Teacher</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#F5F2EB] text-[#A84C32] border border-[#E5E1D8]">
                      <GraduationCap className="h-3 w-3 text-[#A84C32]" />
                      <span>Student</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-2 space-y-1">
            {isTeacher ? (
              <>
                <Link
                  href="/teacher/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#A84C32] shrink-0">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#A84C32]">
                      Educator Dashboard
                    </p>
                    <p className="text-[11px] text-[#5C5A55]">
                      Quizzes, series, content & analytics
                    </p>
                  </div>
                </Link>

                <Link
                  href="/teacher/write"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#A84C32] shrink-0">
                    <PenSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#A84C32]">
                      Write Insight
                    </p>
                    <p className="text-[11px] text-[#5C5A55]">Draft and publish new article</p>
                  </div>
                </Link>

                <Link
                  href="/teacher/quiz/create"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#A84C32] shrink-0">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#A84C32]">
                      Create Quiz
                    </p>
                    <p className="text-[11px] text-[#5C5A55]">Assessment &amp; practice tests</p>
                  </div>
                </Link>

                {teacherSlug && (
                  <Link
                    href={`/teachers/${teacherSlug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#5C5A55] group-hover:text-[#A84C32] shrink-0">
                      <Eye className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#A84C32]">
                        View Public Profile
                      </p>
                      <p className="text-[11px] text-[#5C5A55]">How learners see your profile</p>
                    </div>
                  </Link>
                )}

                <Link
                  href="/quiz/history"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#5C5A55] group-hover:text-[#A84C32] shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#A84C32]">
                      My Quiz History
                    </p>
                    <p className="text-[11px] text-[#5C5A55]">Test attempts & review answers</p>
                  </div>
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#5C5A55] group-hover:text-[#A84C32] shrink-0">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#A84C32]">
                      Account Settings
                    </p>
                    <p className="text-[11px] text-[#5C5A55]">Bio, avatar & credentials</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/quiz/history"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#A84C32] shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#A84C32]">
                      My Quiz History
                    </p>
                    <p className="text-[11px] text-[#5C5A55]">Past tests, scores & solutions</p>
                  </div>
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#5C5A55] group-hover:text-[#A84C32] shrink-0">
                    <Bookmark className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#A84C32]">
                      Saved Insights & Teachers
                    </p>
                    <p className="text-[11px] text-[#5C5A55]">Bookmarked study materials</p>
                  </div>
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#5C5A55] group-hover:text-[#A84C32] shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#A84C32]">
                      My Profile & Bio
                    </p>
                    <p className="text-[11px] text-[#5C5A55]">Class, avatar & details</p>
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Sign Out Action */}
          <div className="p-2 border-t border-[#E5E1D8]/80 bg-[#FAF8F5]/50">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

