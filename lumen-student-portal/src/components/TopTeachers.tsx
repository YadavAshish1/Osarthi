"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  PlaySquare,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";

export interface EducatorCardItem {
  _id?: string;
  headerText?: string;
  name: string;
  image: string;
  themeColor?: string;
  ctaUrl?: string;
  metricCount?: string;
  verifiedText?: string;
  active?: boolean;
  order?: number;
}

interface TeacherTheme {
  borderColor: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  arcColor: string;
  glowColor: string;
  iconBadge: string;
}

const THEMES: Record<string, TeacherTheme> = {
  "#A84C32": {
    borderColor: "border-[#A84C32]",
    pillBg: "bg-[#A84C32]",
    pillBorder: "border-[#8B3A25]",
    pillText: "text-white",
    arcColor: "#A84C32",
    glowColor: "rgba(168, 76, 50, 0.5)",
    iconBadge: "bg-[#FAF0EC] text-[#A84C32] border-[#F0D5CC]",
  },
  "#2B3A67": {
    borderColor: "border-[#2B3A67]",
    pillBg: "bg-[#2B3A67]",
    pillBorder: "border-[#1E294B]",
    pillText: "text-white",
    arcColor: "#2B3A67",
    glowColor: "rgba(43, 58, 103, 0.5)",
    iconBadge: "bg-[#EEF2FF] text-[#2B3A67] border-[#C7D2FE]",
  },
  "#2E7D32": {
    borderColor: "border-[#2E7D32]",
    pillBg: "bg-[#2E7D32]",
    pillBorder: "border-[#1B5E20]",
    pillText: "text-white",
    arcColor: "#2E7D32",
    glowColor: "rgba(46, 125, 50, 0.5)",
    iconBadge: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
  },
  "#D97706": {
    borderColor: "border-[#D97706]",
    pillBg: "bg-[#D97706]",
    pillBorder: "border-[#B45309]",
    pillText: "text-white",
    arcColor: "#D97706",
    glowColor: "rgba(217, 119, 6, 0.5)",
    iconBadge: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  },
  "#7C3AED": {
    borderColor: "border-[#7C3AED]",
    pillBg: "bg-[#7C3AED]",
    pillBorder: "border-[#6D28D9]",
    pillText: "text-white",
    arcColor: "#7C3AED",
    glowColor: "rgba(124, 58, 237, 0.5)",
    iconBadge: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]",
  },
};

const DEFAULT_THEME_KEYS = ["#A84C32", "#2B3A67", "#2E7D32", "#D97706", "#7C3AED"];

function getTheme(color?: string, index: number = 0): TeacherTheme {
  if (color && THEMES[color]) return THEMES[color];
  const fallbackKey = DEFAULT_THEME_KEYS[index % DEFAULT_THEME_KEYS.length];
  return THEMES[fallbackKey];
}

type CarouselItem =
  | { type: "teacher"; data: EducatorCardItem; id: string }
  | { type: "invite"; id: "invite" };

function TeacherCard({
  card,
  index,
  isActive = false,
  onClick,
}: {
  card: EducatorCardItem;
  index: number;
  isActive?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const theme = getTheme(card.themeColor, index);

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-[28px] sm:rounded-[32px] bg-white border-2 pt-8 pb-6 px-5 flex flex-col justify-between select-none cursor-pointer transition-all duration-500 ${isActive
          ? `shadow-[0_28px_60px_-12px_rgba(0,0,0,0.22)] ${theme.borderColor} ring-4 ring-[#A84C32]/10`
          : "shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] border-[#E5E1D8] hover:border-[#D5CFC5]"
        }`}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {/* 1. Top Floating Pill (Header tag from admin, Mentor identity) */}
      <div
        className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 sm:px-5 py-1.5 rounded-full text-[11px] sm:text-xs font-ui font-bold tracking-wide shadow-md whitespace-nowrap z-30 transition-all duration-300 ${isActive
            ? `${theme.pillBg} ${theme.pillText} ${theme.pillBorder} border shadow-md`
            : "bg-[#FAF0EC] text-[#A84C32] border border-[#F0D5CC]"
          }`}
      >
        {card.headerText || "Academic Mentor"}
      </div>

      {/* 2. Educator Image (Free cutout, NO background, NO circle) with Theme Blurry Glow */}
      <div className="relative flex flex-col items-center">
        {/* Blurry glow in the exact theme color of the moti patti (thick curved swoop arc) */}
        <div
          className="absolute top-1 w-36 h-36 sm:w-40 sm:h-40 rounded-full pointer-events-none blur-2xl transition-opacity duration-500"
          style={{
            background: theme.arcColor,
            opacity: isActive ? 0.75 : 0.45,
          }}
        />

        {/* Educator Image: Free-standing cutout resting directly on moti patti with zero gap */}
        <div className="relative z-10 w-44 h-48 sm:w-48 sm:h-52 flex items-end justify-center">
          {card.image ? (
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-contain object-bottom drop-shadow-[0_12px_20px_rgba(0,0,0,0.15)] origin-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 mb-2">
              {card.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Seekho Exact Curved Swoop Arc Vector Path (Moti Patti with White Occlusion Shield below) */}
        <svg
          className="w-full h-12 sm:h-14 pointer-events-none z-20 -mt-10 sm:-mt-12 overflow-visible"
          viewBox="0 0 223 42"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* White Occlusion Shield: completely hides and blocks any image overflow below the moti patti curve */}
          <path
            d="M 0 13.3271 C 33.1309 31.6007 71.2189 42 111.737 42 C 152.062 42 189.98 31.6996 223 13.5881 V 150 H 0 Z"
            fill="#FFFFFF"
          />

          {/* The Themed Moti Patti Ribbon */}
          <path
            d="M111.737 30.4283C70.9465 30.4283 32.7486 19.334 0 0V13.3271C33.1309 31.6007 71.2189 42 111.737 42C152.062 42 189.98 31.6996 223 13.5881V0.279393C190.357 19.4408 152.331 30.4283 111.737 30.4283Z"
            fill={theme.arcColor}
          />
        </svg>

        {/* 3. Educator Name */}
        <h3 className="font-serif-display font-bold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors text-xl sm:text-2xl text-center mt-2 mb-1 tracking-tight z-20 line-clamp-1 px-2">
          {card.name}
        </h3>
      </div>

      {/* 4. Bottom Metric Badges (Faculty keyword removed, uses Verified Mentor) */}
      <div className="flex items-center justify-around w-full mt-3 pt-3 border-t border-[#F0EDE7] z-20">
        <div className="flex flex-col items-center text-center gap-1">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-110 ${theme.iconBadge}`}
          >
            <PlaySquare className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <span className="font-ui text-[11px] sm:text-xs font-bold text-[#1A1A1A] tracking-tight">
            {card.metricCount || "Lead Educator"}
          </span>
        </div>

        <div className="w-px h-7 bg-[#E5E1D8]" />

        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] flex items-center justify-center shadow-xs transition-transform group-hover:scale-110">
            <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <span className="font-ui text-[11px] sm:text-xs font-bold text-[#1A1A1A] tracking-tight">
            {card.verifiedText || "Verified Mentor"}
          </span>
        </div>
      </div>
    </div>
  );
}

function EducatorInviteCard({
  isActive = false,
  onClick,
}: {
  isActive?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const theme = THEMES["#A84C32"];

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-[28px] sm:rounded-[32px] bg-white border-2 pt-8 pb-6 px-5 flex flex-col justify-between select-none cursor-pointer transition-all duration-500 ${isActive
          ? `shadow-[0_28px_60px_-12px_rgba(0,0,0,0.22)] ${theme.borderColor} ring-4 ring-[#A84C32]/10`
          : "shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] border-[#E5E1D8] hover:border-[#D5CFC5]"
        }`}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {/* Top Floating Pill */}
      <div
        className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 sm:px-5 py-1.5 rounded-full text-[11px] sm:text-xs font-ui font-bold tracking-wide shadow-md whitespace-nowrap z-30 transition-all duration-300 ${isActive
            ? `${theme.pillBg} ${theme.pillText} ${theme.pillBorder} border shadow-md`
            : "bg-[#FAF0EC] text-[#A84C32] border border-[#F0D5CC]"
          }`}
      >
        Join Medhashine
      </div>

      <div className="relative flex flex-col items-center">
        {/* Ambient Blurry Glow */}
        <div
          className="absolute top-1 w-36 h-36 sm:w-40 sm:h-40 rounded-full pointer-events-none blur-2xl transition-opacity duration-500"
          style={{
            background: theme.arcColor,
            opacity: isActive ? 0.75 : 0.45,
          }}
        />

        <div className="relative z-10 w-44 h-48 sm:w-48 sm:h-52 flex flex-col items-center justify-center">
          <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-[#FAF0EC] border border-[#F0D5CC] flex items-center justify-center text-[#A84C32] shadow-md group-hover:scale-108 transition-transform">
            <GraduationCap className="w-12 h-12 sm:w-14 sm:h-14" />
          </div>
          <span className="font-ui text-xs font-bold tracking-wider uppercase text-[#A84C32] mt-2.5">
            Join Mentors
          </span>
        </div>

        {/* Seekho Curved Swoop Arc Vector Path (Moti Patti with White Occlusion Shield) */}
        <svg
          className="w-full h-12 sm:h-14 pointer-events-none z-20 -mt-10 sm:-mt-12 overflow-visible"
          viewBox="0 0 223 42"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* White Occlusion Shield */}
          <path
            d="M 0 13.3271 C 33.1309 31.6007 71.2189 42 111.737 42 C 152.062 42 189.98 31.6996 223 13.5881 V 150 H 0 Z"
            fill="#FFFFFF"
          />

          {/* The Themed Moti Patti Ribbon */}
          <path
            d="M111.737 30.4283C70.9465 30.4283 32.7486 19.334 0 0V13.3271C33.1309 31.6007 71.2189 42 111.737 42C152.062 42 189.98 31.6996 223 13.5881V0.279393C190.357 19.4408 152.331 30.4283 111.737 30.4283Z"
            fill={theme.arcColor}
          />
        </svg>

        <h3 className="font-serif-display font-bold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors text-xl sm:text-2xl text-center mt-2 mb-1 tracking-tight z-20">
          Become a Mentor
        </h3>
        <p className="font-serif-body text-[11px] sm:text-xs text-[#5C5A55] text-center max-w-[200px] leading-relaxed z-20 line-clamp-1">
          Teach curious minds across India.
        </p>
      </div>

      <div className="flex items-center justify-around w-full mt-3 pt-3 border-t border-[#F0EDE7] z-20">
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF0EC] text-[#A84C32] border border-[#F0D5CC] flex items-center justify-center shadow-xs">
            <PlaySquare className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <span className="font-ui text-[11px] sm:text-xs font-bold text-[#1A1A1A] tracking-tight">
            1K+ Students
          </span>
        </div>

        <div className="w-px h-7 bg-[#E5E1D8]" />

        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] flex items-center justify-center shadow-xs">
            <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <span className="font-ui text-[11px] sm:text-xs font-bold text-[#1A1A1A] tracking-tight">
            Apply Free
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TopTeachers() {
  const [cards, setCards] = useState<EducatorCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // 3D Circular Arc Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Swipe / Drag references
  const touchStartX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    api
      .get("/explore/top-teachers")
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setCards(data);
        } else {
          setCards([]);
        }
      })
      .catch(() => setCards([]))
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

  // Build carousel items: Custom Educator Cards + 1 Default Invite Card
  const items: CarouselItem[] = [
    ...cards.map(
      (c, idx) => ({ type: "teacher" as const, data: c, id: c._id || `card-${idx}` } as CarouselItem)
    ),
    { type: "invite" as const, id: "invite" },
  ];

  const totalItems = items.length;

  const nextSlide = useCallback(() => {
    if (totalItems === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const prevSlide = useCallback(() => {
    if (totalItems === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  // Autoplay loop (every 3.2 seconds, continuous auto-scroll, does not stop on hover)
  useEffect(() => {
    if (totalItems === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3200);
    return () => clearInterval(interval);
  }, [nextSlide, totalItems]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || mouseStartX.current === null) return;
    const diff = mouseStartX.current - e.clientX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    isDragging.current = false;
    mouseStartX.current = null;
  };

  if (!loading && cards.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      data-testid="top-teachers"
      className="py-10 md:py-16 bg-[#F5F2EB] border-t border-[#EAE5DC] overflow-hidden relative"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 mb-6 sm:mb-8 relative z-10">
        {/* Centered Heading in Medhashine Style */}
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0EC] border border-[#F0D5CC] text-[#A84C32] text-xs font-ui font-bold uppercase tracking-wider mb-2.5 shadow-xs">
            <GraduationCap className="w-3.5 h-3.5" />
            Meet the Educators
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1A1A1A] leading-tight">
            Learn from the{" "}
            <span className="italic underline decoration-[#A84C32]/30 underline-offset-8">
              best minds
            </span>{" "}
            in education.
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-6 px-6 md:px-12 justify-center overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-[280px] sm:w-[315px] shrink-0 rounded-[32px] border-2 border-[#E5E1D8] bg-white animate-pulse p-6 pt-8 min-h-[390px] sm:min-h-[430px]"
            >
              <div className="w-36 h-36 mx-auto rounded-full bg-[#E5E1D8]/50 mb-4" />
              <div className="h-5 w-3/4 mx-auto bg-[#E5E1D8]/60 rounded mb-3" />
              <div className="h-4 w-1/2 mx-auto bg-[#E5E1D8]/40 rounded" />
            </div>
          ))}
        </div>
      ) : (
        /* The Exact 3D Circular Parabolic Arc Container */
        <div
          className="relative w-full overflow-hidden select-none flex flex-col items-center justify-center"
          style={{ minHeight: isMobile ? 470 : 520 }}
          onMouseLeave={() => {
            isDragging.current = false;
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {/* Central 3D Stage */}
          <div className="relative w-full max-w-6xl h-[430px] sm:h-[470px] flex items-center justify-center">
            {items.map((item, index) => {
              // Calculate shortest distance in circular space
              let diff = (index - currentIndex) % totalItems;
              if (diff > totalItems / 2) diff -= totalItems;
              if (diff < -totalItems / 2) diff += totalItems;

              const isCenter = diff === 0;

              // Geometric circular arc positioning
              let x = 0;
              let y = 0;
              let scale = 1;
              let zIndex = 10;
              let opacity = 1;

              if (isMobile) {
                // Mobile curved arc spacing
                if (diff === 0) {
                  x = 0;
                  y = 0;
                  scale = 1.0;
                  zIndex = 50;
                  opacity = 1;
                } else if (diff === 1) {
                  x = 135;
                  y = 26;
                  scale = 0.84;
                  zIndex = 40;
                  opacity = 0.85;
                } else if (diff === -1) {
                  x = -135;
                  y = 26;
                  scale = 0.84;
                  zIndex = 40;
                  opacity = 0.85;
                } else if (diff === 2) {
                  x = 240;
                  y = 55;
                  scale = 0.68;
                  zIndex = 30;
                  opacity = 0.25;
                } else if (diff === -2) {
                  x = -240;
                  y = 55;
                  scale = 0.68;
                  zIndex = 30;
                  opacity = 0.25;
                } else {
                  x = diff > 0 ? 300 : -300;
                  y = 80;
                  scale = 0.5;
                  zIndex = 10;
                  opacity = 0;
                }
              } else {
                // Desktop 3D circular parabolic arc
                if (diff === 0) {
                  x = 0;
                  y = 0;
                  scale = 1.06;
                  zIndex = 50;
                  opacity = 1;
                } else if (diff === 1) {
                  x = 230;
                  y = 34; // Drops DOWN behind center
                  scale = 0.88;
                  zIndex = 40;
                  opacity = 0.9;
                } else if (diff === -1) {
                  x = -230;
                  y = 34; // Drops DOWN behind center
                  scale = 0.88;
                  zIndex = 40;
                  opacity = 0.9;
                } else if (diff === 2) {
                  x = 430;
                  y = 78; // Drops DOWN further
                  scale = 0.74;
                  zIndex = 30;
                  opacity = 0.65;
                } else if (diff === -2) {
                  x = -430;
                  y = 78; // Drops DOWN further
                  scale = 0.74;
                  zIndex = 30;
                  opacity = 0.65;
                } else {
                  x = diff > 0 ? 590 : -590;
                  y = 120;
                  scale = 0.6;
                  zIndex = 10;
                  opacity = 0;
                }
              }

              const handleItemClick = (e: React.MouseEvent) => {
                if (!isCenter) {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(index);
                } else {
                  // If center card is clicked, navigate to card's ctaUrl or default
                  if (item.type === "teacher") {
                    const target = item.data.ctaUrl || `/teachers`;
                    window.location.href = target;
                  } else {
                    window.location.href = "/become-teacher";
                  }
                }
              };

              return (
                <div
                  key={item.id}
                  className="absolute top-6 left-1/2 will-change-transform"
                  style={{
                    width: isMobile ? 265 : 315,
                    height: isMobile ? 385 : 430,
                    zIndex,
                    opacity,
                    transform: `translate3d(calc(-50% + ${x}px), ${y}px, 0) scale(${scale})`,
                    transition:
                      "transform 600ms cubic-bezier(0.25, 1, 0.5, 1), opacity 600ms ease, z-index 0ms",
                    pointerEvents: opacity > 0.1 ? "auto" : "none",
                  }}
                >
                  {item.type === "teacher" ? (
                    <TeacherCard
                      card={item.data}
                      index={index}
                      isActive={isCenter}
                      onClick={handleItemClick}
                    />
                  ) : (
                    <EducatorInviteCard
                      isActive={isCenter}
                      onClick={handleItemClick}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
