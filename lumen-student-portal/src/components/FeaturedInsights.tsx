"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { Clock, ArrowRight, Sparkles, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { api, BlogItem, FALLBACK_BLOGS, mapContentToBlog, getDefaultSubjectCover } from "@/lib/api";

const POPULAR_SUBJECT_FILTERS = [
  { label: "All Insights", icon: "✦", query: "" },
  { label: "Mathematics", icon: "📐", query: "math" },
  { label: "Science & Physics", icon: "🔬", query: "science" },
  { label: "हिन्दी साहित्य", icon: "📜", query: "hindi" },
  { label: "कहानियाँ", icon: "📖", query: "story" },
  { label: "व्याकरण", icon: "✍️", query: "grammar" },
  { label: "संस्कृत", icon: "🪔", query: "sanskrit" },
  { label: "English", icon: "📚", query: "english" },
];

function FeaturedCard({ blog }: { blog: BlogItem }) {
  const coverImage = blog.cover || getDefaultSubjectCover(blog.subject, blog.title || blog.id);

  return (
    <Link
      href={`/blog/${blog.slug || blog.id}`}
      data-testid={`featured-card-${blog.id}`}
      className="group relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 shrink-0 select-none border border-black/10 bg-[#1A1A1A]"
      style={{ width: 205, height: 300 }}
    >
      {/* 1. Full-bleed Background Image */}
      <img
        src={coverImage}
        alt={blog.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-600 ease-out"
      />

      {/* 2. Cinematic Gradient Overlay (Darkens from middle to bottom for clear text) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/15 group-hover:from-black/95 group-hover:via-black/50 transition-colors duration-300" />

      {/* 3. Top Badges: Subject Pill */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
        <span className="bg-[#A84C32]/90 backdrop-blur-md text-white text-[9px] font-ui font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs border border-white/15 truncate max-w-[125px]">
          {blog.subject}
        </span>
      </div>

      {/* 4. Bottom Content: Title & Duration (Seekho-style clean compact layout) */}
      <div className="absolute bottom-0 inset-x-0 p-3.5 z-10 flex flex-col justify-end">
        <h3 className="font-serif-display text-[15px] leading-snug font-bold text-white drop-shadow-md group-hover:text-[#F2B09F] transition-colors line-clamp-2 mb-1.5">
          {blog.title}
        </h3>

        <div className="flex items-center justify-between text-[11px] font-ui text-white/80">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="h-3 w-3 text-[#E8927C]" />
            {blog.read_minutes} mins
          </span>
          <span className="font-semibold text-[#E8927C] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Read <ArrowRight className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ExploreAllCard() {
  return (
    <Link
      href="/insights"
      className="group relative flex flex-col items-center justify-between text-center p-5 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#2D1B17] via-[#1E1917] to-[#12100F] border border-[#A84C32]/30 hover:border-[#A84C32] hover:shadow-xl transition-all duration-300 select-none hover:-translate-y-1.5"
      style={{ width: 205, height: 300 }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#A84C32]/25 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#D48972]/20 blur-2xl pointer-events-none" />

      {/* Top Tag */}
      <div className="z-10 w-full flex justify-center">
        <span className="bg-white/10 backdrop-blur-md text-white/80 text-[9px] font-ui font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/10">
          All Subjects
        </span>
      </div>

      {/* Center Icon & Title */}
      <div className="z-10 flex flex-col items-center my-auto">
        <div className="w-11 h-11 rounded-full bg-[#A84C32] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-[#A84C32]/30 mb-2.5">
          <ArrowRight className="h-5 w-5" />
        </div>
        <h4 className="font-serif-display text-lg font-bold text-white mb-1 leading-snug">
          Explore All Insights
        </h4>
        <p className="font-serif-body text-[11px] text-white/70 leading-relaxed max-w-[160px]">
          Class 6–12 & stories
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="z-10 w-full">
        <span className="inline-block w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-ui font-semibold border border-white/15 transition-colors">
          View All →
        </span>
      </div>
    </Link>
  );
}

export default function FeaturedInsights() {
  const [allInsights, setAllInsights] = useState<BlogItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    api
      .get("/explore/featured?limit=60")
      .then(({ data }) => {
        let loadedItems: BlogItem[] = [];
        if (Array.isArray(data) && data.length > 0) {
          loadedItems = data.map(mapContentToBlog);
        }

        // Ensure foundational subjects (like Mathematics, Physics, English) are present
        const existingTitles = new Set(loadedItems.map((b) => b.title.toLowerCase()));
        const missingFallbacks = FALLBACK_BLOGS.filter(
          (fb) => !existingTitles.has(fb.title.toLowerCase())
        );

        setAllInsights([...loadedItems, ...missingFallbacks]);
      })
      .catch(() => setAllInsights(FALLBACK_BLOGS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Filtered insights based on active subject chip
  const filteredInsights = useMemo(() => {
    if (!activeFilter) return allInsights;

    return allInsights.filter((b) => {
      const sub = (b.subject || "").toLowerCase();
      const tit = (b.title || "").toLowerCase();
      const cls = (b.class_level || "").toLowerCase();
      const top = (b.topic || "").toLowerCase();

      if (activeFilter === "math") {
        return (
          sub.includes("math") ||
          sub.includes("गणित") ||
          tit.includes("math") ||
          tit.includes("prime") ||
          tit.includes("calculus") ||
          tit.includes("euler") ||
          top.includes("calculus") ||
          top.includes("number theory")
        );
      }

      if (activeFilter === "science") {
        return (
          sub.includes("science") ||
          sub.includes("physics") ||
          sub.includes("chem") ||
          sub.includes("bio") ||
          sub.includes("विज्ञान") ||
          sub.includes("भौतिक") ||
          tit.includes("अम्ल") ||
          tit.includes("अल्कोहल") ||
          tit.includes("हाइड्रोकार्बन") ||
          tit.includes("newton")
        );
      }

      if (activeFilter === "hindi") {
        return (
          sub.includes("हिंदी") ||
          sub.includes("हिन्दी") ||
          sub.includes("पद्य") ||
          sub.includes("गद्य")
        );
      }

      if (activeFilter === "story") {
        return (
          sub.includes("कहानी") ||
          cls.includes("कहानी") ||
          cls.includes("प्रेरणादायक") ||
          tit.includes("कागज़") ||
          tit.includes("घड़ी")
        );
      }

      if (activeFilter === "grammar") {
        return (
          sub.includes("व्याकरण") ||
          tit.includes("संधि") ||
          tit.includes("विभक्ति") ||
          tit.includes("वर्णमाला") ||
          tit.includes("उपसर्ग") ||
          tit.includes("विलोम") ||
          tit.includes("पर्यायवाची") ||
          tit.includes("सूत्र")
        );
      }

      if (activeFilter === "sanskrit") {
        return sub.includes("संस्कृत") || tit.includes("संस्कृत") || tit.includes("वाराणसी");
      }

      if (activeFilter === "english") {
        return (
          sub.includes("english") ||
          sub.includes("literature") ||
          tit.includes("english") ||
          tit.includes("metaphor") ||
          tit.includes("prose")
        );
      }

      return sub.includes(activeFilter) || tit.includes(activeFilter);
    });
  }, [allInsights, activeFilter]);

  // If 3 or fewer blogs in the category, they easily fit on screen -> NO auto-scroll!
  const shouldAutoScroll = filteredInsights.length > 3;

  // Build seamless loop list: repeats items if list < 8 so track is always long enough (zero empty gap)
  const marqueeList = useMemo(() => {
    if (filteredInsights.length === 0) return [];
    let list = [...filteredInsights];
    while (list.length < 8) {
      list = [...list, ...filteredInsights];
    }
    return list;
  }, [filteredInsights]);

  // Calm, relaxed flowing water speed (~5s per card)
  const flowDuration = Math.max(55, marqueeList.length * 5);

  const scrollNudge = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section
      ref={sectionRef}
      data-testid="featured-insights"
      className="pt-6 md:pt-8 pb-7 md:pb-9 overflow-hidden bg-[#FAF8F5]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 eyebrow text-[#A84C32] mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Curated For In-Depth Understanding
            </div>
            <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1A1A1A] leading-tight max-w-xl">
              Handpicked reads to{" "}
              <span className="italic underline decoration-[#D48972]/40 decoration-wavy underline-offset-8">
                spark your thinking.
              </span>
            </h2>
          </div>

          {/* Right Navigation & View All */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            <Link
              href={activeFilter ? `/insights?q=${encodeURIComponent(activeFilter)}` : "/insights"}
              className="inline-flex items-center gap-2 font-ui text-sm font-semibold text-[#A84C32] hover:gap-3 transition-all duration-200 mr-2"
            >
              Browse All Insights <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Slider Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollNudge("left")}
                className="w-10 h-10 rounded-full border border-[#E5E1D8] bg-white text-[#1A1A1A] hover:bg-[#A84C32] hover:text-white hover:border-[#A84C32] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollNudge("right")}
                className="w-10 h-10 rounded-full border border-[#E5E1D8] bg-white text-[#1A1A1A] hover:bg-[#A84C32] hover:text-white hover:border-[#A84C32] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                aria-label="Next Slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Popular Subject Filter Chips: Horizontal Swipe on Mobile, Clean Wrap on Desktop with NO clipping */}
        <div className="mt-4 md:mt-5 pt-2.5 border-t border-[#EAE5DC]">
          <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap scrollbar-none py-1.5 px-1 -mx-5 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {POPULAR_SUBJECT_FILTERS.map((item) => {
              const isActive = activeFilter === item.query;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveFilter(item.query)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-ui font-medium transition-colors duration-200 shrink-0 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#A84C32] text-white shadow-sm ring-2 ring-[#A84C32]/25"
                      : "bg-white text-[#2C2B29] border border-[#E0DCD3] hover:border-[#A84C32] hover:text-[#A84C32]"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-6 px-6 md:px-12 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-80 shrink-0 rounded-2xl border border-[#E5E1D8] bg-white animate-pulse overflow-hidden">
              <div className="h-44 bg-[#E5E1D8]/50" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-16 bg-[#E5E1D8]/60 rounded-full" />
                <div className="h-5 w-full bg-[#E5E1D8]/50 rounded" />
                <div className="h-5 w-3/4 bg-[#E5E1D8]/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-2xl border border-[#E5E1D8]">
          <BookOpen className="h-10 w-10 text-[#A84C32] mx-auto mb-3" />
          <h4 className="font-serif-display text-lg font-semibold text-[#1A1A1A] mb-1">
            No insights found for this subject yet
          </h4>
          <p className="font-serif-body text-xs text-[#5C5A55] mb-4">
            Try selecting "All Insights" or explore another topic.
          </p>
          <button
            onClick={() => setActiveFilter("")}
            className="px-4 py-2 rounded-full bg-[#A84C32] text-white text-xs font-ui font-semibold"
          >
            Show All Insights
          </button>
        </div>
      ) : !shouldAutoScroll ? (
        /* <= 3 items: Perfectly static single horizontal row, fits comfortably, NO auto-scroll */
        <div
          ref={scrollContainerRef}
          className="pl-6 md:pl-12 flex items-stretch gap-3.5 overflow-x-auto pb-4 scrollbar-none"
        >
          {filteredInsights.map((blog) => (
            <FeaturedCard key={blog.id} blog={blog} />
          ))}
          <ExploreAllCard />
        </div>
      ) : (
        /* > 3 items: Continuous water flow with hover freeze (NEVER resets to start!) and zero gap */
        <div
          ref={scrollContainerRef}
          className="relative w-full overflow-hidden py-2"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex w-max"
            style={{
              animationName: "waterFlow",
              animationDuration: `${flowDuration}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationPlayState: isPaused ? "paused" : "running",
            }}
          >
            {/* First Track Loop */}
            <div className="flex items-stretch gap-3.5 shrink-0 pl-6 md:pl-12 pr-3.5">
              {marqueeList.map((blog, idx) => (
                <FeaturedCard key={`track1-${blog.id}-${idx}`} blog={blog} />
              ))}
              <ExploreAllCard />
            </div>

            {/* Second Identical Track Loop (Continuous seamless water flow with 0 gap) */}
            <div className="flex items-stretch gap-3.5 shrink-0 pl-6 md:pl-12 pr-3.5" aria-hidden="true">
              {marqueeList.map((blog, idx) => (
                <FeaturedCard key={`track2-${blog.id}-${idx}`} blog={blog} />
              ))}
              <ExploreAllCard />
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS keyframes for seamless infinite continuous water flow */}
      <style jsx>{`
        @keyframes waterFlow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
