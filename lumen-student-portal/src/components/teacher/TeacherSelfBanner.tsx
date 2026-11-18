"use client";

import React from "react";
import Link from "next/link";
import { Eye, LayoutDashboard, Pencil, ShieldCheck } from "lucide-react";

export default function TeacherSelfBanner() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2 font-ui">
      <div className="bg-[#FAF8F5] border border-[#A84C32]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-[#E5E1D8] text-[#A84C32] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs text-[#1A1A1A]">Public Educator View</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Your Profile
              </span>
            </div>
            <p className="text-xs text-[#5C5A55] mt-1 font-serif-body leading-relaxed">
              This is how learners and visitors experience your published insights, bio, and
              credentials.
            </p>
          </div>
        </div>

        {/* Quick Educator Action Buttons (2-col grid on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] text-xs font-semibold transition-colors shadow-2xs text-center"
          >
            <Pencil className="h-3 w-3" />
            <span>Edit Profile</span>
          </Link>
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full bg-[#1A1A1A] text-white hover:bg-[#A84C32] text-xs font-semibold transition-colors shadow-2xs text-center"
          >
            <LayoutDashboard className="h-3 w-3" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
