import React from "react";
import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Get in Touch",
  description:
    "Send us a note about an insight, a topic you'd love to see, or a teacher you'd like to hear from. We read everything.",
  openGraph: {
    title: "Get in Touch | Medhashine Student Portal",
    description:
      "Send us a note about an insight, a topic you'd love to see, or a teacher you'd like to hear from.",
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 md:py-28" data-testid="contact-page">
      <div className="eyebrow text-[#A84C32] mb-4">Say hello</div>
      <h1 className="font-serif-display text-5xl md:text-6xl leading-[1.05] font-medium text-[#1A1A1A]">
        Have a thought, a request, or a warm note?
      </h1>
      <p className="mt-6 font-serif-body text-xl leading-relaxed text-[#5C5A55]">
        We read everything. Send us a note about an essay, a topic you&apos;d love to see, or a teacher you&apos;d like to hear from.
      </p>

      <ContactForm />
    </div>
  );
}
