"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BecomeTeacherBanner() {
  const { user, ready } = useAuth();

  // Hide for logged-in students and teachers
  if (!ready) return null;
  if (user?.role === "student" || user?.role === "teacher") return null;

  return (
    <section
      className="relative overflow-hidden"
      data-testid="become-teacher-banner"
      style={{
        background: "linear-gradient(135deg, #1A1A1A 0%, #2D1F1A 40%, #3D2518 100%)",
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient glow accent */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #A84C32 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #D4956B 0%, transparent 70%)" }}
      />

      <div className="relative max-w-screen-xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left — Text Content */}
          <div className="flex-1 text-center lg:text-left max-w-xl">
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
              style={{
                background: "rgba(168, 76, 50, 0.2)",
                color: "#E8A88A",
                border: "1px solid rgba(168, 76, 50, 0.3)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Join Our Teaching Community
            </div>

            {/* Headline */}
            <h2
              className="font-serif-display text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] font-medium mb-6"
              style={{ color: "#FAF8F5" }}
            >
              Share Your Knowledge.{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #E8A88A 0%, #D4956B 50%, #A84C32 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Inspire the Next Generation.
              </span>
            </h2>

            {/* Subtext */}
            <p
              className="font-ui text-base sm:text-lg leading-relaxed mb-8"
              style={{ color: "rgba(250, 248, 245, 0.65)" }}
            >
              Medhashine empowers educators to create meaningful content, reach
              thousands of students, and build a lasting legacy — all from a
              single, elegant platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <Link
                href="/become-a-teacher"
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-ui text-sm font-semibold text-white transition-all duration-300 hover:shadow-2xl hover:shadow-[#A84C32]/30 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #A84C32 0%, #8B3A25 100%)",
                }}
              >
                Become a Teacher
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-ui text-sm font-medium transition-all duration-300 hover:bg-white/10"
                style={{
                  color: "rgba(250, 248, 245, 0.7)",
                  border: "1px solid rgba(250, 248, 245, 0.15)",
                }}
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right — Image */}
          <div className="flex-1 relative max-w-sm lg:max-w-md w-full">
            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{
                border: "1px solid rgba(168, 76, 50, 0.25)",
              }}
            >
              {/* Gradient overlay on image */}
              <div
                className="absolute inset-0 z-10"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 50%, rgba(26, 26, 26, 0.6) 100%)",
                }}
              />
              <Image
                src="/images/teacher-hero.png"
                alt="Join Medhashine as a teacher and inspire students"
                width={600}
                height={600}
                className="w-full h-84 lg:h-[400px] object-cover"
                priority
              />

              {/* Floating card on image */}
              <div
                className="absolute bottom-6 left-6 right-6 z-20 p-5 rounded-2xl backdrop-blur-xl"
                style={{
                  background: "rgba(26, 26, 26, 0.7)",
                  border: "1px solid rgba(250, 248, 245, 0.1)",
                }}
              >
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: "#E8A88A" }}
                >
                  Start in 3 simple steps
                </p>
                <p
                  className="text-xs"
                  style={{ color: "rgba(250, 248, 245, 0.55)" }}
                >
                  Sign Up → Get Approved → Start Publishing
                </p>
              </div>
            </div>

            {/* Decorative floating elements */}
            <div
              className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl rotate-12 opacity-60 hidden lg:block"
              style={{
                background:
                  "linear-gradient(135deg, rgba(168, 76, 50, 0.3), transparent)",
                border: "1px solid rgba(168, 76, 50, 0.15)",
              }}
            />
            <div
              className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full opacity-40 hidden lg:block"
              style={{
                background: "radial-gradient(circle, #A84C32 0%, transparent 70%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
