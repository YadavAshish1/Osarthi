import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="border-t border-[#E5E1D8] bg-[#F7F4EE] py-16 text-[#5C5A55]"
    >
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between gap-10">
        <div className="max-w-sm">
          <div className="font-serif-display text-3xl font-semibold text-[#1A1A1A] mb-3">
            Medhashine
          </div>
          <p className="font-serif-body text-sm leading-relaxed text-[#5C5A55]">
            A quiet room for insights written by teachers, built for students
            learning to think. Free to read, always.
          </p>
        </div>

        <div className="flex gap-16 font-ui text-sm">
          <div>
            <div className="eyebrow text-[#A84C32] mb-4">Navigation</div>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#1A1A1A] transition-colors"
                >
                  Reading Room
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#1A1A1A] transition-colors"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#1A1A1A] transition-colors"
                >
                  Get in Touch
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow text-[#A84C32] mb-4">Principles</div>
            <ul className="space-y-2.5 text-xs text-[#5C5A55]">
              <li>No Paywalls</li>
              <li>Teacher-Authored</li>
              <li>Quiet Reflection</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-[#E5E1D8]/60 flex flex-col sm:flex-row justify-between items-center text-xs font-ui text-[#5C5A55]/80 gap-4">
        <div>© {new Date().getFullYear()} Medhashine Student Portal. All rights reserved.</div>
        <div>Designed with clarity for curious minds.</div>
      </div>
    </footer>
  );
}
