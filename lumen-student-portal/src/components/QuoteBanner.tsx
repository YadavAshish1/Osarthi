"use client";

import React, { useState, useEffect } from "react";

const QUOTES = [
  {
    text: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
  },
  {
    text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.",
    author: "Aristotle",
  },
  {
    text: "You cannot open a book without learning something.",
    author: "Confucius",
  },
  {
    text: "Curiosity is, in great and generous minds, the first passion and the last.",
    author: "Samuel Johnson",
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    text: "Study without desire spoils the memory, and it retains nothing that it takes in.",
    author: "Leonardo da Vinci",
  },
  {
    text: "Wonder rather than doubt is the root of all knowledge.",
    author: "Abraham Joshua Heschel",
  },
];

export default function QuoteBanner() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(Math.floor(Math.random() * QUOTES.length));
    const t = setInterval(() => setIdx((i) => (i + 1) % QUOTES.length), 8000);
    return () => clearInterval(t);
  }, []);

  const q = QUOTES[idx];

  return (
    <section
      data-testid="quote-banner"
      className="relative overflow-hidden border-b border-[#E5E1D8]"
      style={{
        backgroundImage: `linear-gradient(rgba(20,15,10,0.55), rgba(20,15,10,0.35)), url(https://images.unsplash.com/photo-1514241516423-6c0a5e031aa2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjBsYW5kc2NhcGUlMjBzdW5yaXNlfGVufDB8fHx8MTc4NTMzODg0MHww&ixlib=rb-4.1.0&q=85)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-transparent to-transparent pointer-events-none" />
      <div className="relative max-w-screen-xl mx-auto px-6 md:px-12 min-h-[48vh] md:min-h-[55vh] flex flex-col justify-center py-16 md:py-20">
        <div className="eyebrow text-white/80 mb-4">A thought for today</div>
        <blockquote
          data-testid="quote-text"
          className="font-serif-display italic text-white text-3xl sm:text-5xl lg:text-6xl leading-tight max-w-4xl transition-opacity duration-700"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}
        >
          “{q.text}”
        </blockquote>
        <div
          className="mt-6 font-ui text-sm tracking-widest uppercase text-white/90 font-medium"
          data-testid="quote-author"
        >
          — {q.author}
        </div>
      </div>
    </section>
  );
}
