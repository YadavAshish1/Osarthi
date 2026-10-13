"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { api } from "@/lib/api";

export interface BannerItem {
  _id?: string;
  tag: string;
  title: string;
  subtitle?: string;
  quote?: string;
  author?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  bgImage?: string;
}

const DEFAULT_BANNERS: BannerItem[] = [
  {
    _id: "banner-1",
    tag: "Free Academic Insights · Written by India's Educators",
    title: "Where curious minds master what truly matters.",
    subtitle: "Deep, concept-first insights and faculty guidance for grades 6–12 & competitive exams.",
    quote: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
    ctaText: "Explore All Insights",
    ctaLink: "/insights",
    secondaryCtaText: "Find a Teacher",
    secondaryCtaLink: "/teachers",
    bgImage:
      "https://images.unsplash.com/photo-1514241516423-6c0a5e031aa2?auto=format&fit=crop&w=2000&q=85",
  },
  {
    _id: "banner-2",
    tag: "Exam Excellence · Board & Foundation Special",
    title: "Score with deep conceptual clarity, not rote memorization.",
    subtitle: "High-yield topic notes, exam question breakdowns, and formula intuition by top educators.",
    quote: "Study without desire spoils the memory, and it retains nothing that it takes in.",
    author: "Leonardo da Vinci",
    ctaText: "Browse Exam Notes",
    ctaLink: "/insights",
    secondaryCtaText: "Find Your Mentor",
    secondaryCtaLink: "/teachers",
    bgImage:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=85&w=1600",
  },
];

export default function QuoteBanner() {
  const [banners, setBanners] = useState<BannerItem[]>(DEFAULT_BANNERS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch admin-managed banners
  useEffect(() => {
    api
      .get("/explore/banners")
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data);
        } else {
          setBanners(DEFAULT_BANNERS);
        }
      })
      .catch(() => {
        setBanners(DEFAULT_BANNERS);
      });
  }, []);

  // Auto-scroll when multiple banners exist
  useEffect(() => {
    if (banners.length <= 1) return;

    timerRef.current = setInterval(() => {
      goToNext();
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, currentIdx]);

  const goToNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % banners.length);
      setIsFading(false);
    }, 350);
  };

  const goToPrev = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev - 1 + banners.length) % banners.length);
      setIsFading(false);
    }, 350);
  };

  const selectBanner = (index: number) => {
    if (index === currentIdx) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentIdx(index);
      setIsFading(false);
    }, 350);
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) goToNext();
    if (distance < -50) goToPrev();
    setTouchStart(null);
    setTouchEnd(null);
  };

  const banner = banners[currentIdx] || DEFAULT_BANNERS[0];
  const bg = banner.bgImage || DEFAULT_BANNERS[0].bgImage;
  const hasMultiple = banners.length > 1;

  return (
    <section
      data-testid="quote-banner"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden transition-all duration-700 min-h-[340px] sm:min-h-[380px] md:min-h-[440px] flex flex-col justify-between"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
      }}
    >
      {/* Dark warm ambient overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background:
            "linear-gradient(165deg, rgba(14,10,7,0.85) 0%, rgba(26,16,10,0.72) 50%, rgba(168,76,50,0.35) 100%)",
        }}
      />

      {/* Smooth bottom blend */}
      <div
        className="absolute bottom-0 left-0 right-0 h-14 md:h-20 pointer-events-none"
        style={{ background: "linear-gradient(to top, #FAF8F5, transparent)" }}
      />

      {/* Banner Content Container (Compact, balanced on mobile & desktop) */}
      <div className="relative max-w-screen-xl mx-auto px-5 sm:px-6 md:px-12 w-full py-7 sm:py-9 md:py-12 my-auto z-10">
        <div
          className={`grid grid-cols-1 ${banner.quote ? "md:grid-cols-12 gap-8 md:gap-10" : "max-w-3xl"} items-center transition-opacity duration-400`}
          style={{ opacity: isFading ? 0 : 1 }}
        >
          {/* Left Column: Headline, Subtitle & CTAs */}
          <div className={`${banner.quote ? "md:col-span-7" : "w-full"} flex flex-col gap-3.5`}>

            <h1
              className="font-serif-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-medium text-white leading-[1.2]"
              style={{ textShadow: "0 2px 14px rgba(0,0,0,0.6)" }}
            >
              {banner.title}
            </h1>

            {banner.subtitle && (
              <p className="font-ui text-sm sm:text-base text-white/85 leading-relaxed max-w-xl">
                {banner.subtitle}
              </p>
            )}

            {/* Action Row: Full-width stacked on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2 w-full sm:w-auto">
              <Link
                href={banner.ctaLink || "/insights"}
                id="hero-explore-cta"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-full font-ui text-xs sm:text-sm font-bold text-white transition-all duration-300 hover:shadow-xl hover:scale-105 text-center shadow-md cursor-pointer"
                style={{ background: "linear-gradient(135deg, #A84C32 0%, #8B3A25 100%)" }}
              >
                <BookOpen className="h-4 w-4" />
                <span>{banner.ctaText || "Explore All Insights"}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              {banner.secondaryCtaText && (
                <Link
                  href={banner.secondaryCtaLink || "/teachers"}
                  id="hero-teachers-cta"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3 sm:py-2.5 rounded-full font-ui text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all text-center cursor-pointer"
                >
                  {banner.secondaryCtaText}
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Floating Glass Quote Card */}
          {banner.quote && (
            <div className="md:col-span-5 flex justify-center md:justify-end">
              <div
                className="p-5 sm:p-6 rounded-2xl backdrop-blur-md border border-white/20 max-w-md w-full shadow-2xl relative overflow-hidden"
                style={{
                  background: "rgba(18, 12, 8, 0.50)",
                  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.35)",
                }}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-ui font-semibold text-[#E8A88A] uppercase tracking-wider mb-2">
                  <Sparkles className="h-3 w-3 text-[#E67E22]" />
                  A Thought For Today
                </div>
                <blockquote
                  data-testid="quote-text"
                  className="font-serif-display italic text-white text-base sm:text-lg md:text-xl leading-snug"
                >
                  "{banner.quote}"
                </blockquote>
                {banner.author && (
                  <div
                    className="mt-2.5 font-ui text-[11px] sm:text-xs tracking-wider uppercase text-white/70 font-semibold text-right"
                    data-testid="quote-author"
                  >
                    — {banner.author}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Dots Indicator: ONLY SHOWN IF MULTIPLE BANNERS (> 1) */}
      {hasMultiple && (
        <div className="relative z-20 pb-6 flex items-center justify-center gap-2.5">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectBanner(i)}
              className="transition-all duration-400 rounded-full cursor-pointer"
              style={{
                width: i === currentIdx ? 28 : 8,
                height: 8,
                background: i === currentIdx ? "#E67E22" : "rgba(255,255,255,0.35)",
                boxShadow: i === currentIdx ? "0 0 10px rgba(230,126,34,0.6)" : "none",
              }}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
