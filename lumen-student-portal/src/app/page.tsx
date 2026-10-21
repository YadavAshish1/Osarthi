"use client";

import React from "react";
import QuoteBanner from "@/components/QuoteBanner";
import FeaturedInsights from "@/components/FeaturedInsights";
import StatsBar from "@/components/StatsBar";
import TopTeachers from "@/components/TopTeachers";
import TestimonialsSection from "@/components/TestimonialsSection";
import StartLearningBanner from "@/components/StartLearningBanner";
import BecomeTeacherBanner from "@/components/BecomeTeacherBanner";
import AdSenseBanner from "@/components/google-ad-sense/AdSenseBanner";

export default function Home() {
  return (
    <>
      {/* 1. Hero — Admin-manageable multiple banners with auto-scroll & dots */}
      <QuoteBanner />

      {/* 2. Handpicked Insights — Flowing water continuous stream with subject filter chips */}
      <FeaturedInsights />

      {/* 3. Platform Impact Stats — Interactive 3-metric highlight cards (under Handpicked Insights) */}
      <StatsBar />

      {/* Non-intrusive AdSense Banner */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 my-6">
        <AdSenseBanner slot="4103581240" />
      </div>

      {/* 4. Top Teachers / Creators — Educators showcase */}
      <TopTeachers />

      {/* 5. Testimonials — "Why students trust Medhashine" */}
      <TestimonialsSection />

      {/* 6. Start Learning Today — Dark glowing crescendo CTA banner */}
      <StartLearningBanner />

      {/* 7. Become a Teacher — Partner community banner */}
      <BecomeTeacherBanner />
    </>
  );
}
