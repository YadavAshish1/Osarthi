import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <p className="eyebrow text-[#A84C32] mb-3">404 — Page Not Found</p>
      <h1 className="font-serif-display text-4xl md:text-5xl font-semibold text-[#1A1A1A]">
        This page could not be found.
      </h1>
      <p className="mt-4 font-serif-body text-lg text-[#5C5A55]">
        The insight or educator profile you requested may have been unpublished, moved, or removed.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 font-ui text-sm">
        <Link
          href="/insights"
          className="px-6 py-2.5 rounded-full bg-[#A84C32] text-white font-semibold hover:bg-[#8B3A25] transition-colors"
        >
          Browse All Insights
        </Link>
        <Link
          href="/teachers"
          className="px-6 py-2.5 rounded-full border border-[#E5E1D8] bg-white text-[#1A1A1A] hover:border-[#A84C32] transition-colors"
        >
          Find Teachers
        </Link>
      </div>
    </div>
  );
}
