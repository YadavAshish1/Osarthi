"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function StartLearningBanner() {
  const { user, ready, openAuth } = useAuth();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-testid="start-learning-banner"
      className="relative overflow-hidden py-12 md:py-16"
      style={{
        background: "linear-gradient(135deg, #1C1513 0%, #2B1B16 50%, #17110F 100%)",
      }}
    >
      {/* Decorative ambient glow orbs */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ background: "radial-gradient(circle, #A84C32 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: "radial-gradient(circle, #E67E22 0%, transparent 70%)" }}
      />

      <div
        className="relative max-w-screen-xl mx-auto px-6 md:px-12 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(28px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A84C32]/25 border border-[#A84C32]/40 text-[#F5C2B4] font-ui text-xs font-semibold uppercase tracking-widest mb-4">
          <Sparkles className="h-3.5 w-3.5 text-[#E67E22]" />
          Unlock Your Potential
        </div>

        {/* Heading */}
        <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-tight mb-4 max-w-3xl mx-auto">
          Start learning today.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #E8A88A 0%, #E67E22 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Shape your future.
          </span>
        </h2>

        {/* Subtext */}
        <p className="font-ui text-sm sm:text-base text-white/75 leading-relaxed max-w-2xl mx-auto mb-8">
          Join thousands of school and college students who build deep conceptual clarity with syllabus-aligned insights written by passionate educators.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/insights"
            id="start-learning-primary-cta"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-ui text-sm font-bold text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            style={{ background: "linear-gradient(135deg, #A84C32 0%, #8B3A25 100%)" }}
          >
            <BookOpen className="h-4 w-4" />
            <span>Browse All Insights</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>

          {ready && !user ? (
            <button
              id="start-learning-signup-cta"
              onClick={() => openAuth("register")}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-ui text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 backdrop-blur-md shadow-sm transition-all duration-300 cursor-pointer"
            >
              <Users className="h-4 w-4" />
              <span>Create Free Account</span>
            </button>
          ) : (
            <Link
              href="/teachers"
              id="start-learning-teachers-cta"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-ui text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 backdrop-blur-md shadow-sm transition-all duration-300"
            >
              <Users className="h-4 w-4" />
              <span>Explore Mentors Directory</span>
            </Link>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-ui text-white/70">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#E67E22]" />
            Free Forever for Students
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#E67E22]" />
            No Paywall & No Distractions
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#E67E22]" />
            Expert Mentor Insights
          </span>
        </div>
      </div>
    </section>
  );
}
