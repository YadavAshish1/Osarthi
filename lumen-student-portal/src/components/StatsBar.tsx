"use client";

import React, { useEffect, useRef, useState } from "react";
import { Users, BookOpen, GraduationCap, Star } from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  learners: string;
  insights: string;
  mentors: string;
}

const FALLBACK_STATS: Stats = {
  learners: "10,000+",
  insights: "250+",
  mentors: "50+",
};

export default function StatsBar() {
  const [stats, setStats] = useState<Stats>(FALLBACK_STATS);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get("/explore/stats")
      .then(({ data }) => {
        if (data && typeof data === "object") {
          setStats({
            learners: data.learners || FALLBACK_STATS.learners,
            insights: data.insights || FALLBACK_STATS.insights,
            mentors: data.mentors || FALLBACK_STATS.mentors,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      data-testid="stats-bar"
      className="py-6 sm:py-10 md:py-12 relative overflow-hidden bg-[#FAF8F5] border-t border-[#EAE5DC]"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
        {/* Floating Stats Capsule Card (Seekho-style 3-column horizontal strip on both Mobile & Desktop) */}
        <div
          className="max-w-4xl mx-auto rounded-xl sm:rounded-3xl bg-white border border-[#E5E1D8] shadow-sm hover:shadow-md transition-all duration-500"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <div className="grid grid-cols-3 divide-x divide-[#E5E1D8] py-3 sm:py-6 px-1.5 sm:px-8">
            {/* Stat 1: Learners */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4 px-1 sm:px-4">
              <div className="w-8 h-8 sm:w-13 sm:h-13 rounded-lg sm:rounded-2xl flex items-center justify-center bg-[#FAF0EC] text-[#A84C32] border border-[#F0D5CC] shrink-0">
                <Users className="w-4 h-4 sm:w-6.5 sm:h-6.5 stroke-[2]" />
              </div>
              <div className="flex flex-col text-center sm:text-left min-w-0">
                <span className="font-serif-display text-sm sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] tracking-tight leading-none">
                  {stats.learners}
                </span>
                <span className="font-ui text-[10px] sm:text-xs md:text-sm text-[#78756F] font-semibold tracking-tight sm:tracking-wide mt-0.5 sm:mt-1 truncate">
                  Learners
                </span>
              </div>
            </div>

            {/* Stat 2: Insights */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4 px-1 sm:px-4">
              <div className="w-8 h-8 sm:w-13 sm:h-13 rounded-lg sm:rounded-2xl flex items-center justify-center bg-[#FFF5EB] text-[#E67E22] border border-[#FDE3CF] shrink-0">
                <BookOpen className="w-4 h-4 sm:w-6.5 sm:h-6.5 stroke-[2]" />
              </div>
              <div className="flex flex-col text-center sm:text-left min-w-0">
                <span className="font-serif-display text-sm sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] tracking-tight leading-none">
                  {stats.insights}
                </span>
                <span className="font-ui text-[10px] sm:text-xs md:text-sm text-[#78756F] font-semibold tracking-tight sm:tracking-wide mt-0.5 sm:mt-1 truncate">
                  Insights
                </span>
              </div>
            </div>

            {/* Stat 3: Mentors */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4 px-1 sm:px-4">
              <div className="w-8 h-8 sm:w-13 sm:h-13 rounded-lg sm:rounded-2xl flex items-center justify-center bg-[#FAF0EC] text-[#A84C32] border border-[#F0D5CC] shrink-0">
                <GraduationCap className="w-4 h-4 sm:w-6.5 sm:h-6.5 stroke-[2]" />
              </div>
              <div className="flex flex-col text-center sm:text-left min-w-0">
                <span className="font-serif-display text-sm sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] tracking-tight leading-none">
                  {stats.mentors}
                </span>
                <span className="font-ui text-[10px] sm:text-xs md:text-sm text-[#78756F] font-semibold tracking-tight sm:tracking-wide mt-0.5 sm:mt-1 truncate">
                  Mentors
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof Headline & Rating */}
        <div
          className="text-center mt-6 sm:mt-9 transition-all duration-700 delay-150"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <h2 className="font-serif-display text-lg sm:text-3xl md:text-4xl font-medium text-[#1A1A1A] tracking-tight">
            Why {stats.learners} learners trust{" "}
            <span className="italic underline decoration-[#A84C32]/30 decoration-wavy underline-offset-6">
              Medhashine
            </span>.
          </h2>
          <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mt-2 text-[11px] sm:text-sm text-[#5C5A55] font-ui">
            <span className="inline-flex items-center gap-1 font-bold text-[#A84C32] bg-[#FAF0EC] px-2 py-0.5 rounded-full border border-[#F0D5CC]">
              <Star className="w-3 h-3 fill-[#A84C32] text-[#A84C32]" /> 4.8 Rating
            </span>
            <span>by 5,000+ students &amp; educators · Concept-First · Free Forever</span>
          </div>
        </div>
      </div>
    </section>
  );
}
