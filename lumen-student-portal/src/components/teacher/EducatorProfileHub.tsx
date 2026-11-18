"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  LayoutDashboard,
  PenSquare,
  Eye,
  Users,
  BookOpen,
  Award,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { api, getTeacherSlug } from "@/lib/api";
import { User } from "@/context/AuthContext";

interface EducatorProfileHubProps {
  user: User;
}

export default function EducatorProfileHub({ user }: EducatorProfileHubProps) {
  const [subCount, setSubCount] = useState<number | null>(null);
  const [insightsCount, setInsightsCount] = useState<number | null>(null);
  const [quizCount, setQuizCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const teacherSlug = getTeacherSlug(user.id, user.name);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const [subRes, contentRes, quizRes] = await Promise.all([
          api.get("/subscriptions/teacher/count").catch(() => api.get("/subscription/teacher/count")).catch(() => ({ data: { count: 0 } })),
          api.get("/content/teacher/analytics").catch(() => ({ data: { publishedCount: 0 } })),
          api.get("/quiz/teacher/analytics").catch(() => ({ data: { publishedQuizzes: 0 } })),
        ]);

        if (isMounted) {
          setSubCount(subRes.data?.count ?? 0);
          setInsightsCount(contentRes.data?.publishedCount ?? 0);
          setQuizCount(quizRes.data?.publishedQuizzes ?? 0);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="bg-white rounded-3xl border border-[#E5E1D8] p-5 sm:p-6 md:p-8 shadow-xs font-ui">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-[#E5E1D8]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Verified Educator Workspace</span>
            </span>
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1A1A] leading-tight">
            Educator Hub & Showcase
          </h2>
          <p className="text-xs text-[#5C5A55] mt-1 max-w-xl font-serif-body leading-relaxed">
            Manage your student outreach, monitor your publications, and inspect how learners
            discover your teaching profile.
          </p>
        </div>

        {/* Primary CTA Buttons (Balanced 2-col on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
          <Link
            href={`/teachers/${teacherSlug}`}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-full border border-[#E5E1D8] bg-[#FAF8F5] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors text-xs font-semibold shadow-2xs text-center"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="truncate">Public Profile</span>
            <ExternalLink className="h-3 w-3 opacity-60 hidden sm:inline" />
          </Link>
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-full bg-[#1A1A1A] text-white hover:bg-[#A84C32] transition-colors text-xs font-semibold shadow-2xs text-center"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span className="truncate">Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5 hidden sm:inline" />
          </Link>
        </div>
      </div>

      {/* Stats Summary Grid (Space-efficient 3-col on all screen sizes) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 my-5 sm:my-6">
        <div className="p-2.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8]/80 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-4">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-white border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] shrink-0 shadow-2xs">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium text-[#5C5A55] uppercase tracking-wider truncate">
              Subscribers
            </p>
            <p className="font-serif-display text-lg sm:text-2xl font-semibold text-[#1A1A1A] mt-0.5">
              {loading ? "…" : subCount}
            </p>
          </div>
        </div>

        <div className="p-2.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8]/80 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-4">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-white border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] shrink-0 shadow-2xs">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium text-[#5C5A55] uppercase tracking-wider truncate">
              Insights
            </p>
            <p className="font-serif-display text-lg sm:text-2xl font-semibold text-[#1A1A1A] mt-0.5">
              {loading ? "…" : insightsCount}
            </p>
          </div>
        </div>

        <div className="p-2.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8]/80 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-4">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-white border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] shrink-0 shadow-2xs">
            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium text-[#5C5A55] uppercase tracking-wider truncate">
              Quizzes
            </p>
            <p className="font-serif-display text-lg sm:text-2xl font-semibold text-[#1A1A1A] mt-0.5">
              {loading ? "…" : quizCount}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
        <Link
          href="/teacher/write"
          className="p-4 sm:p-5 rounded-2xl border border-[#E5E1D8] bg-white hover:border-[#A84C32] hover:bg-[#FAF8F5]/60 transition-all flex items-start gap-3 sm:gap-4 group cursor-pointer shadow-2xs"
        >
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#A84C32] shrink-0 transition-colors">
            <PenSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-serif-display text-sm sm:text-base font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors flex items-center justify-between">
              <span>Write a New Insight</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#5C5A55] group-hover:text-[#A84C32] group-hover:translate-x-0.5 transition-all" />
            </h4>
            <p className="text-xs text-[#5C5A55] mt-1 font-serif-body leading-relaxed line-clamp-2">
              Draft comprehensive subject guides, conceptual breakdowns, or solved problems with
              rich media.
            </p>
          </div>
        </Link>

        <Link
          href="/teacher/dashboard"
          className="p-4 sm:p-5 rounded-2xl border border-[#E5E1D8] bg-white hover:border-[#A84C32] hover:bg-[#FAF8F5]/60 transition-all flex items-start gap-3 sm:gap-4 group cursor-pointer shadow-2xs"
        >
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] group-hover:border-[#A84C32]/30 text-[#A84C32] shrink-0 transition-colors">
            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-serif-display text-sm sm:text-base font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors flex items-center justify-between">
              <span>Manage Quizzes & Series</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#5C5A55] group-hover:text-[#A84C32] group-hover:translate-x-0.5 transition-all" />
            </h4>
            <p className="text-xs text-[#5C5A55] mt-1 font-serif-body leading-relaxed line-clamp-2">
              Schedule test deadlines, toggle submissions, group tests into series, and view student
              scores.
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
