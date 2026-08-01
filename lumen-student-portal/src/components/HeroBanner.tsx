export default function HeroBanner() {
  return (
    <section
      data-testid="quote-banner"
      className="relative overflow-hidden border-b border-[#E5E1D8]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(20, 15, 10, 0.55), rgba(20, 15, 10, 0.35)), url("https://images.unsplash.com/photo-1514241516423-6c0a5e031aa2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjBsYW5kc2NhcGUlMjBzdW5yaXNlfGVufDB8fHx8MTc4NTMzODg0MHww&ixlib=rb-4.1.0&q=85")',
        backgroundSize: "cover",
        backgroundPosition: "center center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-transparent to-transparent pointer-events-none" />
      <div className="relative max-w-screen-xl mx-auto px-6 md:px-12 min-h-[52vh] md:min-h-[60vh] flex flex-col justify-center py-20">
        <div className="eyebrow text-white/80 mb-6">A thought for today</div>
        <blockquote
          data-testid="quote-text"
          className="font-serif-display italic text-white text-3xl sm:text-5xl lg:text-6xl leading-tight max-w-4xl rise-in"
          style={{ textShadow: "rgba(0, 0, 0, 0.35) 0px 2px 12px" }}
        >
          &ldquo;Curiosity is, in great and generous minds, the first passion
          and the last.&rdquo;
        </blockquote>
        <div
          className="mt-6 text-sm tracking-widest uppercase text-white/90"
          data-testid="quote-author"
        >
          &mdash; Samuel Johnson
        </div>
      </div>
    </section>
  );
}
