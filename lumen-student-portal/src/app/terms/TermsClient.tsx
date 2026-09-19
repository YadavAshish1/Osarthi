"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Scale,
  FileCheck2,
  Lock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Building2,
  Users,
  ExternalLink,
  GraduationCap,
} from "lucide-react";

export default function TermsClient() {
  return (

    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] selection:bg-[#A84C32] selection:text-white">
      {/* ── Top Hero Banner ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] text-white pt-10 pb-12 md:pt-14 md:pb-16 px-6 md:px-12 border-b border-[#2E2D2B]">
        {/* Subtle background ambient glow */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 20%, #A84C32 0%, transparent 50%), radial-gradient(circle at 20% 80%, #D4956B 0%, transparent 40%)`,
          }}
        />

        <div className="max-w-screen-xl mx-auto relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">

            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#A84C32]/20 border border-[#A84C32]/40 text-[#E8A88A]">
                <ShieldAlert className="w-3.5 h-3.5 text-[#E8A88A]" />
                <span>Statutory Intellectual Property Notice &amp; Terms of Service</span>
              </div>
              <h1 className="font-serif-display text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
                Terms of Service &amp; Copyright Charter
              </h1>
              <p className="text-sm md:text-base text-[#D0CCC5] leading-relaxed max-w-2xl font-sans">
                Official terms governing educational materials, proprietary study notes, and legal safeguards for creators, authors, and contributing teachers across Medhashine.
              </p>
            </div>
          </div>


          {/* Metadata bar */}
          <div className="pt-4 border-t border-[#2E2D2B] flex flex-wrap items-center gap-6 text-xs text-[#A09D96]">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#E8A88A]" />
              <span className="text-[#6E6B65]">Academic Governance: </span>
              <strong className="text-white font-medium">Medhashine, its Creators, Authors &amp; Contributing Teachers</strong>
            </div>
            <div>
              <span className="text-[#6E6B65]">Statutory Framework: </span>
              <span className="text-white font-mono">Copyright Act 1957 | BNS 2023 | IT Act 2000</span>
            </div>
            <div>
              <span className="text-[#6E6B65]">Official Domain: </span>
              <span className="text-[#E8A88A] font-mono">medhashine.in</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Body ── */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Statutory Clauses & Notice */}
          <div className="lg:col-span-8 space-y-10">
            {/* Official Warning Header Banner */}
            <div className="bg-[#FFF5F2] border-2 border-[#A84C32] rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#A84C32] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#A84C32]">
                    Statutory Public Warning &amp; Copyright Declaration
                  </span>
                  <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                    Copyright &amp; Final Legal Warning
                  </h2>
                </div>
              </div>

              <p className="text-base sm:text-lg text-[#2E2A27] leading-relaxed font-serif-body font-medium">
                All original lecture notes, pedagogical explanations, analytical classification charts, taxonomies, curriculum compilations, presentations, and MCQ question banks hosted and published on <strong>medhashine.in</strong> are the exclusive intellectual property of <strong>Medhashine, its content creators, authors, and contributing teachers</strong>. All statutory copyrights and legal protections under the law are strictly reserved.
              </p>
            </div>

            {/* Section 1: Study License Scope */}
            <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2.5 text-[#A84C32] font-semibold text-sm">
                <FileCheck2 className="w-5 h-5" />
                <span>1. Limited Personal Study License Only</span>
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#1A1A1A]">
                Content Access is Granted Exclusively for Individual Personal Study
              </h3>
              <p className="text-sm sm:text-base text-[#4A4742] leading-relaxed">
                Members who pay course fees, join study cohorts, or download digital documents are provided access strictly for their individual personal learning. Paying fees, joining study groups, or receiving PDF notes confers absolutely no right to sell, reproduce, publish, share, or commercially exploit this educational material in any manner whatsoever.
              </p>
            </div>

            {/* Section 2: Prohibited Actions */}
            <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
              <div className="flex items-center gap-2.5 text-[#B91C1C] font-semibold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>2. Explicitly Prohibited Infringing Conduct</span>
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#1A1A1A]">
                Without Prior Written Permission from Medhashine, the Following Acts Constitute Severe Copyright Infringement:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  "Selling or offering for sale in PDF, printed book, or digital package form",
                  "Advertising, presenting, or soliciting for commercial sale or illicit monetization",
                  "Sharing across WhatsApp groups, Telegram channels, websites, apps, or social media",
                  "Utilizing inside third-party coaching centers, online academies, or test series",
                  "Publishing under one's own name or any other individual/institutional banner",
                  "Removing Medhashine author names, watermarks, logos, or digital identifiers",
                  "Copying, scraping, or reproducing any substantial portion of teacher insights and notes",
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3.5 bg-[#FAF8F5] border border-[#EBE7DF] rounded-xl text-xs sm:text-sm text-[#383531] font-medium"
                  >
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Legal Consequences & Acts */}
            <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
              <div className="flex items-center gap-2.5 text-[#A84C32] font-semibold text-sm">
                <Scale className="w-5 h-5" />
                <span>3. Statutory Penal Provisions &amp; Legal Remedies</span>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-[#4A4742] leading-relaxed">
                <div className="p-4 bg-[#FAF8F5] border-l-4 border-[#A84C32] rounded-r-xl space-y-2">
                  <strong className="text-[#1A1A1A] block font-serif">
                    The Copyright Act, 1957 (Sections 51, 55, 57, 58, 62, 63, 63A, &amp; 64):
                  </strong>
                  <p className="text-xs sm:text-sm text-[#5C5A55]">
                    Any infringement will immediately attract civil and criminal proceedings. Remedies sought on behalf of Medhashine and its creators include judicial <strong>injunctions (restraining orders)</strong>, <strong>punitive damages</strong>, disgorgement of illicit profits, <strong>seizure of all infringing electronic and printed copies</strong>, and cognizable <strong>criminal prosecution with mandatory imprisonment and fines</strong>.
                  </p>
                </div>

                <div className="p-4 bg-[#FAF8F5] border-l-4 border-amber-600 rounded-r-xl space-y-2">
                  <strong className="text-[#1A1A1A] block font-serif">
                    Bharatiya Nyaya Sanhita (BNS), 2023 (Sections 318, 319, 336, &amp; 340):
                  </strong>
                  <p className="text-xs sm:text-sm text-[#5C5A55]">
                    If any person falsely claims association with Medhashine, misrepresents course or teacher affiliation, or illicitly collects funds, criminal First Information Reports (FIR) will be filed under Sections 318 &amp; 319 (Cheating &amp; Fraud) and Sections 336 &amp; 340 (Forgery &amp; Fraudulent Electronic Records).
                  </p>
                </div>

                <div className="p-4 bg-[#FAF8F5] border-l-4 border-slate-700 rounded-r-xl space-y-2">
                  <strong className="text-[#1A1A1A] block font-serif">
                    The Information Technology Act, 2000 (Sections 66C &amp; 66D):
                  </strong>
                  <p className="text-xs sm:text-sm text-[#5C5A55]">
                    Digital impersonation, online piracy, and unauthorized cyber transmissions of Medhashine resources are prosecuted under non-bailable cyber crime provisions before specialized State Cyber Crime Units.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Jurisdiction */}
            <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2.5 text-[#A84C32] font-semibold text-sm">
                <Building2 className="w-5 h-5" />
                <span>4. Judicial Jurisdiction &amp; Cyber Crime Enforcement</span>
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#1A1A1A]">
                Competent Civil Courts &amp; Law Enforcement Authorities
              </h3>
              <p className="text-sm sm:text-base text-[#4A4742] leading-relaxed">
                Medhashine administers its academic resources, curriculum developments, and platform operations within its registered jurisdictional headquarters. Unauthorized commercialization directly causes severe injury to the copyright and economic interests of Medhashine and its educators. Therefore, as authorized under Section 62 of the Copyright Act, 1957 and Section 20 of the Code of Civil Procedure (CPC), 1908, all civil suits and legal actions shall be initiated before competent courts having jurisdiction over Medhashine&apos;s administrative domicile.
              </p>
              <p className="text-sm sm:text-base text-[#4A4742] leading-relaxed">
                For offenses perpetrated electronically or online, criminal complaints shall be lodged before the competent police authorities, Cyber Crime Units, and Magistrate Courts pursuant to Sections 197, 198, and 202 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.
              </p>
            </div>

            {/* Section 5: Cease and Desist Directive */}
            <div className="bg-[#FAF8F5] border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 space-y-4">
              <h3 className="font-serif-display text-lg font-bold text-[#1A1A1A]">
                Cease and Desist Directive to All Infringers
              </h3>
              <p className="text-sm text-[#5C5A55] leading-relaxed">
                All individuals, coaching institutes, and entities involved in unauthorized reproduction or sharing are hereby formally directed to immediately halt the sale, advertisement, publication, uploading, and transmission of all materials; purge online download links; permanently destroy all unauthorized copies; and submit a formal written undertaking confirming compliance.
              </p>
              <p className="text-sm text-[#5C5A55] leading-relaxed font-semibold">
                Continued infringement following this formal statutory warning will be tendered before the Court as conclusive proof of willful, deliberate, and premeditated copyright violation.
              </p>
            </div>

            {/* Academic Council Signature Block */}
            <div className="p-6 bg-white border border-[#E5E1D8] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-[#A84C32] font-semibold uppercase tracking-wider mb-1">
                  Authorized Governance &amp; Proprietary Rights Holders
                </div>
                <div className="font-serif-display text-2xl font-bold text-[#1A1A1A]">
                  Medhashine Academic &amp; Legal Governance Council
                </div>
                <div className="text-xs text-[#5C5A55]">
                  On behalf of Medhashine, its Content Creators, Authors &amp; Contributing Teachers
                </div>
              </div>
              <div className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E5E1D8] rounded-lg text-xs font-mono text-[#5C5A55]">
                medhashine.in/terms
              </div>
            </div>

            {/* ── Section: Teacher Data Protection & Content Charter ── */}
            <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
              <div className="flex items-center gap-2.5 text-[#0D9488] font-semibold text-sm">
                <Lock className="w-5 h-5" />
                <span>Teacher Data Confidentiality &amp; Intellectual Property Protection</span>
              </div>
              <h3 className="font-serif-display text-2xl font-bold text-[#1A1A1A]">
                Comprehensive Safeguards for Educator Privacy &amp; Authored Content
              </h3>
              <p className="text-sm sm:text-base text-[#4A4742] leading-relaxed">
                Medhashine is firmly committed to upholding the personal security, identity privacy, and intellectual property rights of all contributing teachers, authors, and academic mentors:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl space-y-2 text-xs sm:text-sm text-[#134E48]">
                  <strong className="flex items-center gap-2 text-[#0F766E] font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Strict Personal Data Confidentiality
                  </strong>
                  <p>
                    An educator&apos;s mobile number, email, date of birth, and identity verification credentials (KYC/certificates) are cryptographically encrypted at rest. This data is strictly withheld from students, readers, and all third-party aggregators.
                  </p>
                </div>

                <div className="p-4 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl space-y-2 text-xs sm:text-sm text-[#134E48]">
                  <strong className="flex items-center gap-2 text-[#0F766E] font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Teacher Insight Copyright Protection
                  </strong>
                  <p>
                    Original pedagogical articles, guides, and educational insights published by educators on Medhashine are protected under this identical Copyright &amp; Anti-Piracy Framework. Unauthorized scraping or external republishing is legally prohibited.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Whistleblower & Piracy Reporting Box (Sticky) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Piracy Reporting Card */}
              <div className="bg-[#1A1A1A] text-white rounded-2xl p-6 space-y-4 border border-[#2E2D2B] shadow-md">
                <div className="flex items-center gap-2.5 text-[#E8A88A] font-semibold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Confidential Piracy Reporting</span>
                </div>
                <h4 className="font-serif-display text-lg font-bold text-white">
                  Report Unauthorized Content Distribution
                </h4>
                <p className="text-xs text-[#C5C1BA] leading-relaxed">
                  If you discover any individual, channel, or commercial entity illicitly selling, scraping, or sharing Medhashine notes, question banks, or teacher insights, please report it immediately:
                </p>

                <ul className="space-y-1.5 text-xs text-[#A09D96]">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A84C32]" />
                    <span>Telegram channel or WhatsApp group links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A84C32]" />
                    <span>Associated mobile numbers, UPI IDs, or payment links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A84C32]" />
                    <span>Screenshots, screen recordings, or illicit PDF copies</span>
                  </li>
                </ul>

                <div className="p-3 bg-[#262523] rounded-xl border border-[#3E3C39] text-xs space-y-1">
                  <span className="text-[#8E8B85] block">Confidential Legal Reporting Inbox:</span>
                  <a
                    href="mailto:privacy@medhashine.in"
                    className="font-mono text-sm text-[#E8A88A] font-bold hover:underline block"
                  >
                    privacy@medhashine.in
                  </a>
                </div>

                <p className="text-[11px] text-[#8E8B85] italic">
                  * The identity of all reporting individuals is held in strict, absolute confidentiality.
                </p>
              </div>

              {/* Related Policies */}
              <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 space-y-3 shadow-2xs">
                <div className="text-xs font-semibold text-[#A84C32] uppercase tracking-wider">
                  Related Trust &amp; Legal Policies
                </div>
                <div className="space-y-2 text-xs font-medium">
                  <Link
                    href="/privacy"
                    className="flex items-center justify-between p-2.5 rounded-lg text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#E5E1D8]"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#A84C32]" />
                      Privacy Policy &amp; DPDP Charter
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8E8B85]" />
                  </Link>

                  <Link
                    href="/help"
                    className="flex items-center justify-between p-2.5 rounded-lg text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#E5E1D8]"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#A84C32]" />
                      Help &amp; Support Center
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8E8B85]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
