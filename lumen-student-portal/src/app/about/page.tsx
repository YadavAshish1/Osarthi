import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Medhashine Student Portal",
  description: "A quiet room for insights written by teachers who care.",
  openGraph: {
    title: "About Us | Medhashine Student Portal",
    description: "A quiet room for insights written by teachers who care.",
    images: [{ url: "/assets/images/branding.jpg", alt: "Medhashine Brand Showcase" }],
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 md:py-24" data-testid="about-page">
      <div className="eyebrow text-[#A84C32] mb-4">Our story</div>
      <h1 className="font-serif-display text-5xl md:text-6xl leading-[1.05] font-medium text-[#1A1A1A]">
        A quiet room for insights written by teachers who care.
      </h1>

      {/* Brand Showcase Image */}
      <div className="my-10 overflow-hidden rounded-2xl border border-[#E5E1D8] shadow-md group">
        <img
          src="/assets/images/branding.jpg"
          alt="Medhashine - Illuminating Minds, Empowering Futures"
          className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
        />
      </div>

      <p className="mt-8 font-serif-body text-xl leading-relaxed text-[#2A2A2A]">
        Medhashine is a reading portal built for curious students. Every essay here is authored by a teacher — someone who has spent years turning difficult ideas into clear, patient explanations.
      </p>
      <p className="mt-5 font-serif-body text-lg leading-relaxed text-[#2A2A2A]">
        We keep the reading free, and always will. No paywalls, no attention traps, no distractions. When a piece moves you, we invite you to create a free account to leave a reflection — because the best kind of learning is a conversation.
      </p>
      <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 font-ui">
        {[
          {
            k: "Free to read",
            v: "No account required. Ever.",
          },
          {
            k: "Teacher-authored",
            v: "Every essay comes from a working educator.",
          },
          {
            k: "Thoughtful comments",
            v: "Threaded replies, likes, and edits — never noise.",
          },
        ].map((item) => (
          <div
            key={item.k}
            className="p-6 bg-white border border-[#E5E1D8] rounded-xl shadow-xs"
          >
            <div className="eyebrow text-[#A84C32] mb-2">{item.k}</div>
            <div className="font-serif-body text-[15px] leading-relaxed text-[#2A2A2A]">
              {item.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
