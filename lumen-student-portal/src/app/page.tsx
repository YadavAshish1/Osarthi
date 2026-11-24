import type { Metadata } from "next";
import { API, mapContentToBlog } from "@/lib/api";
import QuoteBanner from "@/components/QuoteBanner";
import FeaturedInsights from "@/components/FeaturedInsights";
import StatsBar from "@/components/StatsBar";
import TopTeachers from "@/components/TopTeachers";
import TestimonialsSection from "@/components/TestimonialsSection";
import StartLearningBanner from "@/components/StartLearningBanner";
import BecomeTeacherBanner from "@/components/BecomeTeacherBanner";
import AdSenseBanner from "@/components/google-ad-sense/AdSenseBanner";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "https://www.medhashine.in/",
  },
};

async function safeFetchJson(url: string) {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const [bannersRaw, featuredRaw, statsRaw, topTeachersRaw, testimonialsRaw] = await Promise.all([
    safeFetchJson(`${API}/explore/banners`),
    safeFetchJson(`${API}/explore/featured?limit=60`),
    safeFetchJson(`${API}/explore/stats`),
    safeFetchJson(`${API}/explore/top-teachers`),
    safeFetchJson(`${API}/explore/testimonials`),
  ]);

  const initialBanners = Array.isArray(bannersRaw) ? bannersRaw : null;
  const initialBlogs = Array.isArray(featuredRaw) ? featuredRaw.map(mapContentToBlog) : undefined;
  const initialStats = statsRaw && typeof statsRaw === "object" ? statsRaw : null;
  const initialTeachers = Array.isArray(topTeachersRaw) ? topTeachersRaw : null;
  const initialTestimonials = Array.isArray(testimonialsRaw) ? testimonialsRaw : null;

  return (
    <>
      {/* 1. Hero — Admin-manageable multiple banners with auto-scroll & dots */}
      <QuoteBanner initialBanners={initialBanners} />

      {/* 2. Handpicked Insights — Flowing water continuous stream with subject filter chips */}
      <FeaturedInsights initialBlogs={initialBlogs} />

      {/* 3. Platform Impact Stats — Interactive 3-metric highlight cards (under Handpicked Insights) */}
      <StatsBar initialStats={initialStats} />

      {/* Non-intrusive AdSense Banner */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 my-6">
        <AdSenseBanner slot="4103581240" />
      </div>

      {/* 4. Top Teachers / Creators — Educators showcase */}
      <TopTeachers initialTeachers={initialTeachers} />

      {/* 5. Testimonials — "Why students trust Medhashine" */}
      <TestimonialsSection initialTestimonials={initialTestimonials} />

      {/* 6. Start Learning Today — Dark glowing crescendo CTA banner */}
      <StartLearningBanner />

      {/* 7. Become a Teacher — Partner community banner */}
      <BecomeTeacherBanner />
    </>
  );
}
