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
          <div className="flex items-center gap-2.5 mb-3">
            <img
              src="/logo/logo.svg"
              alt="Medhashine Logo"
              className="w-9 h-9 object-cover rounded-full shadow-xs border border-[#E5E1D8]"
            />
            <div className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">
              Medhashine
            </div>
          </div>
          <p className="font-serif-body text-sm leading-relaxed text-[#5C5A55]">
            A quiet room for insights written by teachers, built for students
            learning to think. Free to read, always.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 sm:gap-14 font-ui text-sm">
          <div>
            <div className="eyebrow text-[#A84C32] mb-4">Navigation</div>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="hover:text-[#1A1A1A] transition-colors">
                  Reading Room
                </Link>
              </li>
              <li>
                <Link href="/teachers" className="hover:text-[#1A1A1A] transition-colors">
                  Find Teachers
                </Link>
              </li>
              <li>
                <Link href="/become-a-teacher" className="hover:text-[#1A1A1A] transition-colors">
                  Become a Teacher
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#1A1A1A] transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#1A1A1A] transition-colors">
                  Get in Touch
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow text-[#A84C32] mb-4">Trust & Legal</div>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/privacy"
                  className="text-[#1A1A1A] font-medium hover:text-[#A84C32] transition-colors flex items-center gap-1.5"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy#minors" className="hover:text-[#1A1A1A] transition-colors">
                  Child Safety & Minors
                </Link>
              </li>
              <li>
                <Link href="/privacy#security" className="hover:text-[#1A1A1A] transition-colors">
                  Security Architecture
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[#1A1A1A] transition-colors text-[#A84C32] font-medium">
                  Help & Support Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow text-[#A84C32] mb-4">Principles</div>
            <ul className="space-y-2.5 text-xs text-[#5C5A55]">
              <li>No Paywalls Ever</li>
              <li>Teacher-Authored</li>
              <li>Zero Data Selling</li>
              <li>Quiet Reflection</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-[#E5E1D8]/60 flex flex-col sm:flex-row justify-between items-center text-xs font-ui text-[#5C5A55]/80 gap-4">
        <div>© {new Date().getFullYear()} Medhashine. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-[#1A1A1A] hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/help" className="hover:text-[#1A1A1A] hover:underline">
            Support
          </Link>
          <span>•</span>
          <span>Designed with clarity for curious minds.</span>
        </div>
      </div>
    </footer>
  );
}
