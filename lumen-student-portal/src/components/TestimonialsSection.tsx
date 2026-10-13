"use client";

import React, { useEffect, useRef, useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Autoplay, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import { api } from "@/lib/api";

interface Testimonial {
  _id?: string;
  name: string;
  role: string;
  avatar: string;
  review: string;
  rating: number;
}

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    name: "Aarav Sharma",
    role: "Class 10 Student, Delhi",
    avatar: "https://res.cloudinary.com/dve3lbolq/image/upload/v1791907115/medhashine/students/aarav-sharma.jpg",
    review: "Medhashine completely changed how I study for board exams. The insights written by real mentors actually explain the core logic — not just rote formulas. Scored 94% in Science this year!",
    rating: 5,
  },
  {
    name: "Ananya Iyer",
    role: "Grade 12 Student, Bengaluru",
    avatar: "https://res.cloudinary.com/dve3lbolq/image/upload/v1791907115/medhashine/students/ananya-iyer.jpg",
    review: "The Biology and Chemistry breakdowns helped me connect textbook theory with deep conceptual clarity. Having access to genuine subject scholars solved all my doubts.",
    rating: 5,
  },
  {
    name: "Rohan Verma",
    role: "Class 11 Student, Kota",
    avatar: "https://res.cloudinary.com/dve3lbolq/image/upload/v1791907116/medhashine/students/rohan-verma.jpg",
    review: "Finally found a platform where teachers care about building intuition. The calculus notes and physics mechanics breakdowns saved my foundation for competitive exams.",
    rating: 5,
  },
  {
    name: "Pooja Deshmukh",
    role: "Class 10 Student, Pune",
    avatar: "https://res.cloudinary.com/dve3lbolq/image/upload/v1791907117/medhashine/students/pooja-deshmukh.jpg",
    review: "The daily reading room is like having an intellectual elder sibling who explains concepts beautifully. I look forward to reading a new insight every morning before school.",
    rating: 5,
  },
  {
    name: "Aditya Patel",
    role: "Grade 12 Student, Ahmedabad",
    avatar: "https://res.cloudinary.com/dve3lbolq/image/upload/v1791907118/medhashine/students/aditya-patel.jpg",
    review: "I was struggling with Chemistry and literature analysis and couldn't afford expensive coaching. Medhashine's free insights are coaching institute quality. Absolutely recommend it.",
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-[#E67E22] fill-[#E67E22]" : "text-[#E5E1D8]"}`}
        />
      ))}
      <span className="ml-1 text-xs font-ui font-bold text-[#1A1A1A]">5.0</span>
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const initials = t.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="relative bg-white border border-[#E5E1D8] hover:border-[#D48972] rounded-2xl p-7 flex flex-col justify-between shadow-xs hover:shadow-xl transition-all duration-350 hover:-translate-y-1"
      style={{ width: 360, minHeight: 320, flexShrink: 0 }}
    >
      <div>
        {/* Top Header: Rating & Quote watermark */}
        <div className="flex items-center justify-between mb-4">
          <StarRating rating={t.rating} />
          <Quote className="h-7 w-7 text-[#A84C32]/25 fill-[#A84C32]/10" />
        </div>

        {/* Review snippet */}
        <p className="font-serif-body text-[14px] leading-relaxed text-[#2A2926] mb-5">
          "{t.review}"
        </p>
      </div>

      {/* Reviewer Details */}
      <div className="pt-4 border-t border-[#F0EDE7] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-[#E5E1D8] shadow-xs bg-[#F5F2EB]">
            {t.avatar ? (
              <img
                src={t.avatar}
                alt={t.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            )}
          </div>
          <div>
            <div className="font-ui text-sm font-bold text-[#1A1A1A]">{t.name}</div>
            <div className="font-ui text-xs text-[#5C5A55]">{t.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  useEffect(() => {
    api
      .get("/explore/testimonials")
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data);
        } else {
          setTestimonials(FALLBACK_TESTIMONIALS);
        }
      })
      .catch(() => setTestimonials(FALLBACK_TESTIMONIALS))
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

  return (
    <section
      ref={sectionRef}
      data-testid="testimonials-section"
      className="py-10 md:py-14 overflow-hidden border-t border-[#EAE5DC]"
      style={{
        background: "linear-gradient(to bottom, #FAF8F5 0%, #F5F1EB 100%)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 mb-7">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 eyebrow text-[#A84C32] mb-3">
              Real Experiences · Real Outcomes
            </div>
            <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1A1A1A] leading-tight max-w-xl">
              Why students <span className="italic underline decoration-[#A84C32]/30 underline-offset-8">trust</span> Medhashine.
            </h2>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => swiperInstance?.slidePrev()}
              className="w-10 h-10 rounded-full border border-[#D5CFC5] bg-white text-[#1A1A1A] hover:bg-[#A84C32] hover:text-white hover:border-[#A84C32] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
              aria-label="Previous Review"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => swiperInstance?.slideNext()}
              className="w-10 h-10 rounded-full border border-[#D5CFC5] bg-white text-[#1A1A1A] hover:bg-[#A84C32] hover:text-white hover:border-[#A84C32] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
              aria-label="Next Review"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-5 px-6 md:px-12 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-80 shrink-0 rounded-2xl border border-[#E5E1D8] bg-white animate-pulse p-7 min-h-[300px]">
              <div className="h-3 w-24 bg-[#E5E1D8]/60 rounded-full mb-4" />
              <div className="space-y-2 mb-6">
                <div className="h-3 w-full bg-[#E5E1D8]/40 rounded" />
                <div className="h-3 w-5/6 bg-[#E5E1D8]/40 rounded" />
                <div className="h-3 w-4/6 bg-[#E5E1D8]/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pl-6 md:pl-12 pb-4">
          <Swiper
            modules={[FreeMode, Autoplay, Navigation]}
            onSwiper={setSwiperInstance}
            spaceBetween={20}
            slidesPerView="auto"
            freeMode={{ enabled: true, momentum: true }}
            autoplay={{ delay: 4500, disableOnInteraction: true, pauseOnMouseEnter: true }}
            className="swiper-accent-theme !overflow-visible"
          >
            {testimonials.map((t, i) => (
              <SwiperSlide key={t._id || i} style={{ width: "auto" }}>
                <TestimonialCard t={t} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </section>
  );
}
