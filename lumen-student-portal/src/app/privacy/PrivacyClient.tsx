"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  FileText,
  Mail,
  Scale,
  CheckCircle2,
  ArrowRight,
  Database,
  Globe2,
  Clock,
  Languages,
  ChevronDown,
} from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  type PolicyTranslation,
} from "./translations";

export default function PrivacyClient() {
  const [activeSection, setActiveSection] = useState("charter");
  const [selectedLang, setSelectedLang] = useState("en");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const effectiveDate = "September 19, 2026";
  const policyVersion = "Version 2.4 (Enterprise Edition)";

  const t: PolicyTranslation = TRANSLATIONS[selectedLang] || TRANSLATIONS["en"];
  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  const indianLanguages = SUPPORTED_LANGUAGES.filter((l) => l.region === "Indian");
  const internationalLanguages = SUPPORTED_LANGUAGES.filter((l) => l.region === "International");

  const sections = [
    { id: "charter", title: "1. Our Privacy Charter & Core Promise", icon: ShieldCheck },
    { id: "collection", title: "2. Information We Collect", icon: Database },
    { id: "usage", title: "3. How We Use Educational Data", icon: FileText },
    { id: "minors", title: "4. Student & Minor Privacy (Under 18)", icon: UserCheck },
    { id: "security", title: "5. Technical Architecture & Safeguards", icon: Lock },
    { id: "sharing", title: "6. Zero Data-Selling & Service Providers", icon: EyeOff },
    { id: "retention", title: "7. Data Retention & Right to Erasure", icon: Clock },
    { id: "rights", title: "8. Your Legal Rights (DPDP & GDPR)", icon: Scale },
    { id: "cookies", title: "9. Cookies & Session Technologies", icon: Globe2 },
    { id: "grievance", title: "10. Grievance Officer & Contact", icon: Mail },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const closeDropdown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-lang-selector]")) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const s1 = t.sections.find((s) => s.id === "charter") || t.sections[0];
  const s2 = t.sections.find((s) => s.id === "collection") || t.sections[1];
  const s3 = t.sections.find((s) => s.id === "usage") || t.sections[2];
  const s4 = t.sections.find((s) => s.id === "minors") || t.sections[3];
  const s5 = t.sections.find((s) => s.id === "security") || t.sections[4];
  const s6 = t.sections.find((s) => s.id === "sharing") || t.sections[5];
  const s7 = t.sections.find((s) => s.id === "retention") || t.sections[6];
  const s8 = t.sections.find((s) => s.id === "rights") || t.sections[7];
  const s9 = t.sections.find((s) => s.id === "cookies") || t.sections[8];
  const s10 = t.sections.find((s) => s.id === "grievance") || t.sections[9];

  const sectionIconMap: Record<string, React.ElementType> = {
    charter: ShieldCheck,
    collection: Database,
    usage: FileText,
    minors: UserCheck,
    security: Lock,
    sharing: EyeOff,
    retention: Clock,
    rights: Scale,
    cookies: Globe2,
    grievance: Mail,
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A]">
      {/* ── Hero Banner ── */}
      <section className="relative bg-[#1A1A1A] text-white pt-10 pb-16 md:pt-14 md:pb-20 border-b border-[#A84C32]/30 z-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#A84C32_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden pointer-events-none" />
        <div className="relative max-w-screen-xl mx-auto px-6 md:px-12">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#A84C32]/20 text-[#E8A88A] border border-[#A84C32]/30 w-fit">
              <ShieldCheck className="w-4 h-4 text-[#A84C32]" />
              {t.heroBadge || "Trust & Data Governance Framework"}
            </div>

            {/* ── Language Selector Dropdown (Top Right as originally placed) ── */}
            <div className="relative" data-lang-selector>
              <button
                type="button"
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
                aria-label="Select Language"
              >
                <Languages className="w-4 h-4 text-[#E8A88A]" />
                <span className="font-semibold">{currentLangObj.nativeName}</span>
                <span className="text-white/60 text-[11px]">({currentLangObj.name})</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#262626] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 text-white text-xs max-h-80 overflow-y-auto">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A84C32] px-2 py-1 flex items-center justify-between">
                    <span>भारतीय भाषाएं (Indian Languages)</span>
                    <span className="text-[10px] text-white/40">🇮🇳</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {indianLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setSelectedLang(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          selectedLang === lang.code
                            ? "bg-[#A84C32] text-white font-semibold"
                            : "hover:bg-white/10 text-white/90"
                        }`}
                      >
                        <span className="font-medium">{lang.nativeName}</span>
                        <span className="text-[11px] text-white/60">{lang.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A84C32] px-2 py-1 mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span>International Languages</span>
                    <span className="text-[10px] text-white/40">🌐</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {internationalLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setSelectedLang(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          selectedLang === lang.code
                            ? "bg-[#A84C32] text-white font-semibold"
                            : "hover:bg-white/10 text-white/90"
                        }`}
                      >
                        <span className="font-medium">{lang.nativeName}</span>
                        <span className="text-[11px] text-white/60">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white max-w-4xl leading-tight">
            {t.heroTitle || "Privacy Policy & Student Data Charter"}
          </h1>

          <p className="mt-6 font-serif-body text-lg md:text-xl text-[#B8B2A7] max-w-3xl leading-relaxed">
            {t.heroSubtitle || "At Medhashine, we believe educational curiosity thrives only in an environment of total digital safety. We do not sell student data, we do not run behavioral advertising networks, and we hold ourselves to the highest global data protection standards."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-mono text-[#8C827A] pt-6 border-t border-[#333]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.effectiveDateLabel || `Effective Date: ${effectiveDate}`}
            </span>
            <span>•</span>
            <span>{t.policyVersionLabel || `Policy: ${policyVersion}`}</span>
            <span>•</span>
            <span>{t.statutoryCompliance || "DPDP Act (India) 2023 & COPPA Compliant"}</span>
          </div>
        </div>
      </section>

      {/* ── Executive Summary / 4 Pillar Cards ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-12 -mt-8 relative z-30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-[#E5E1D8] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-[#A84C32]/10 text-[#A84C32] flex items-center justify-center mb-3">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#1A1A1A] text-sm">
              {t.pillars?.[0]?.title || "Zero Data Selling"}
            </h3>
            <p className="text-xs text-[#5C5A55] mt-1.5 leading-relaxed">
              {t.pillars?.[0]?.desc || "We never monetize, rent, trade, or auction learner or teacher data to data brokers or advertisers."}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#E5E1D8] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#1A1A1A] text-sm">
              {t.pillars?.[1]?.title || "Student-First Safety"}
            </h3>
            <p className="text-xs text-[#5C5A55] mt-1.5 leading-relaxed">
              {t.pillars?.[1]?.desc || "Full protection for minors under Section 9 of the DPDP Act 2023 & US COPPA. No behavioral tracking of kids."}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#E5E1D8] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#1A1A1A] text-sm">
              {t.pillars?.[2]?.title || "Enterprise Security"}
            </h3>
            <p className="text-xs text-[#5C5A55] mt-1.5 leading-relaxed">
              {t.pillars?.[2]?.desc || "AES-256 encryption at rest, TLS 1.3 in transit, HttpOnly SameSite cookie isolation, and robust CSRF defense."}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#E5E1D8] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#1A1A1A] text-sm">
              {t.pillars?.[3]?.title || "Full Data Sovereignty"}
            </h3>
            <p className="text-xs text-[#5C5A55] mt-1.5 leading-relaxed">
              {t.pillars?.[3]?.desc || "You own your information. Complete rights to download, rectify, or permanently purge your account anytime."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* ── Left Sidebar Navigation (Sticky) ── */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-xs">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#A84C32] mb-3">
                  {t.tocTitle || "Policy Table of Contents"}
                </div>

                <nav className="space-y-1">
                  {t.sections.map((sec) => {
                    const Icon = sectionIconMap[sec.id] || FileText;
                    const isActive = activeSection === sec.id;
                    return (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? "bg-[#1A1A1A] text-white shadow-xs"
                            : "text-[#5C5A55] hover:bg-[#F7F4EE] hover:text-[#1A1A1A]"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#E8A88A]" : "text-[#A84C32]"}`} />
                        <span className="truncate">{sec.num}: {sec.title}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* Grievance Quick Box */}
              <div className="bg-[#F7F4EE] rounded-2xl border border-[#E5E1D8] p-5 text-xs text-[#5C5A55] space-y-2">
                <div className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#A84C32]" />
                  {t.needHelpTitle || "Need Privacy Support?"}
                </div>
                <p className="leading-relaxed">
                  {t.needHelpDesc || "Have questions about your personal data or minor protection? Contact our dedicated Data Protection Officer."}
                </p>
                <div className="pt-2 font-mono text-[#A84C32] font-semibold">
                  privacy@medhashine.in
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main Legal Clauses Content ── */}
          <main className="lg:col-span-8 space-y-16 font-serif-body text-[#3A3834] leading-relaxed text-base md:text-lg">
            
            {/* Section 1 */}
            <article id="charter" className="scroll-mt-28 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s1.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s1.title}
              </h2>
              {s1.content.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}
              {s1.highlight && (
                <div className="bg-[#FAF0EC] border-l-4 border-[#A84C32] p-5 rounded-r-xl text-sm font-sans space-y-2 text-[#4A2418]">
                  <div className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#A84C32]" />
                    {s1.highlight.title}
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {s1.highlight.points.map((pt, ptIdx) => (
                      <li key={ptIdx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            {/* Section 2 */}
            <article id="collection" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#E5E1D8]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s2.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s2.title}
              </h2>
              {s2.content[0] && <p>{s2.content[0]}</p>}

              <div className="space-y-4 font-sans text-sm">
                <div className="border border-[#E5E1D8] bg-white rounded-xl p-5">
                  <h3 className="font-semibold text-base text-[#1A1A1A] mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#A84C32]" />
                    A. {s2.content[1]?.split(":")[0] || "Account Registration & Profile Data"}
                  </h3>
                  <p className="text-[#5C5A55] text-xs leading-relaxed">
                    {s2.content[1] || "Full Name, Email Address, cryptographically hashed passwords (bcrypt), and academic grade preferences."}
                  </p>
                </div>

                <div className="border border-[#E5E1D8] bg-white rounded-xl p-5">
                  <h3 className="font-semibold text-base text-[#1A1A1A] mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#A84C32]" />
                    B. {s2.content[2]?.split(":")[0] || "Educator Verification Data"}
                  </h3>
                  <p className="text-[#5C5A55] text-xs leading-relaxed">
                    {s2.content[2] || "Academic credentials, verified teaching background, and mandatory mobile number used exclusively for two-factor verification and governance."}
                  </p>
                </div>

                <div className="border border-[#E5E1D8] bg-white rounded-xl p-5">
                  <h3 className="font-semibold text-base text-[#1A1A1A] mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#A84C32]" />
                    C. {s2.content[3]?.split(":")[0] || "Technical Telemetry & Perimeter Security"}
                  </h3>
                  <p className="text-[#5C5A55] text-xs leading-relaxed">
                    {s2.content[3] || "IP addresses for network defense, browser user-agents, and cryptographically signed session tokens strictly for security."}
                  </p>
                </div>
              </div>
            </article>

            {/* Section 3 */}
            <article id="usage" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#E5E1D8]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s3.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s3.title}
              </h2>
              {s3.content[0] && <p>{s3.content[0]}</p>}
              <ul className="list-disc list-inside space-y-2 text-base">
                {s3.content.slice(1).map((pt, ptIdx) => (
                  <li key={ptIdx}>{pt}</li>
                ))}
              </ul>
            </article>

            {/* Section 4 */}
            <article id="minors" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#E5E1D8]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s4.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s4.title}
              </h2>
              {s4.content[0] && <p>{s4.content[0]}</p>}

              <div className="bg-white border border-[#E5E1D8] rounded-xl p-6 font-sans space-y-4 text-xs">
                <div className="font-semibold text-sm text-[#1A1A1A]">
                  {s4.title}:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E5E1D8]">
                    <span className="font-semibold text-[#1A1A1A] block mb-1">
                      {s4.content[1]?.split(":")[0] || "Section 9 DPDP Act (India)"}
                    </span>
                    <span className="text-[#5C5A55] leading-relaxed">
                      {s4.content[1] || "No tracking, behavioral monitoring, or targeted advertisements directed at individuals under 18 years of age."}
                    </span>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E5E1D8]">
                    <span className="font-semibold text-[#1A1A1A] block mb-1">
                      {s4.content[2]?.split(":")[0] || "Parental Rights & Protections"}
                    </span>
                    <span className="text-[#5C5A55] leading-relaxed">
                      {s4.content[2] || "Parents and legal guardians may review, request a copy of, or instruct the permanent erasure of their child’s account at any time."}
                    </span>
                  </div>
                </div>
                {s4.content[3] && (
                  <p className="text-[#5C5A55] leading-relaxed">
                    {s4.content[3]}
                  </p>
                )}
              </div>
            </article>

            {/* Section 5 */}
            <article id="security" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#E5E1D8]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s5.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s5.title}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                <div className="p-4 bg-white rounded-xl border border-[#E5E1D8]">
                  <h4 className="font-semibold text-sm text-[#1A1A1A] mb-1.5 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#A84C32]" />
                    {s5.content[0]?.split(":")[0] || "Session Encryption & Isolation"}
                  </h4>
                  <p className="text-[#5C5A55] leading-relaxed">
                    {s5.content[0] || "User sessions are managed through cryptographically secured, browser-isolated authentication cookies (HttpOnly, Secure)."}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E5E1D8]">
                  <h4 className="font-semibold text-sm text-[#1A1A1A] mb-1.5 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {s5.content[1]?.split(":")[0] || "Input Sanitization & Injection Defense"}
                  </h4>
                  <p className="text-[#5C5A55] leading-relaxed">
                    {s5.content[1] || "Multi-stage sanitizers strip raw HTML, neutralize cross-site scripting (XSS) vectors, and escape search queries."}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E5E1D8]">
                  <h4 className="font-semibold text-sm text-[#1A1A1A] mb-1.5 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-600" />
                    {s5.content[2]?.split(":")[0] || "CSRF Origin Validation"}
                  </h4>
                  <p className="text-[#5C5A55] leading-relaxed">
                    {s5.content[2] || "Strict Origin and Referer validation on all mutating HTTP methods rejects unauthorized cross-site requests."}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E5E1D8]">
                  <h4 className="font-semibold text-sm text-[#1A1A1A] mb-1.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    {s5.content[3]?.split(":")[0] || "Intelligent Rate Limiting"}
                  </h4>
                  <p className="text-[#5C5A55] leading-relaxed">
                    {s5.content[3] || "Multi-tier IP rate limiting prevents brute-force authentication attempts and denial-of-service abuse."}
                  </p>
                </div>
              </div>
            </article>

            {/* Section 6 */}
            <article id="sharing" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#E5E1D8]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s6.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s6.title}
              </h2>
              {s6.content[0] && <p>{s6.content[0]}</p>}

              <div className="overflow-x-auto font-sans text-xs">
                <table className="w-full border border-[#E5E1D8] bg-white rounded-xl overflow-hidden text-left">
                  <thead className="bg-[#F7F4EE] border-b border-[#E5E1D8] text-[#1A1A1A] font-semibold">
                    <tr>
                      <th className="p-3">Service Provider Category</th>
                      <th className="p-3">Purpose & Educational Role</th>
                      <th className="p-3">Data Scope Handled</th>
                      <th className="p-3">Compliance & Security Standard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8] text-[#5C5A55]">
                    <tr>
                      <td className="p-3 font-medium text-[#1A1A1A]">Cloud Compute & Hosting Infrastructure</td>
                      <td className="p-3">Platform uptime, server infrastructure, and secure API execution</td>
                      <td className="p-3">Encrypted application workloads and session routing</td>
                      <td className="p-3">SOC 2 Type II, ISO/IEC 27001</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#1A1A1A]">Encrypted Database Storage Providers</td>
                      <td className="p-3">Secure, isolated persistence of educational posts, taxonomy, and profiles</td>
                      <td className="p-3">Account data, authored insights, and learning interactions</td>
                      <td className="p-3">AES-256 encryption at rest, TLS 1.3 in transit</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#1A1A1A]">Media Content Delivery Networks (CDNs)</td>
                      <td className="p-3">Fast, optimized delivery of educational diagrams and teacher profile images</td>
                      <td className="p-3">Authorized educational illustrations and avatar images</td>
                      <td className="p-3">Strict file verification & secure caching</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#1A1A1A]">Transactional Email Infrastructure</td>
                      <td className="p-3">Critical account verification, password resets, and support alerts</td>
                      <td className="p-3">Recipient email address and system notification text</td>
                      <td className="p-3">SPF, DKIM, TLS end-to-end transport security</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {s6.content[2] && (
                <p className="text-xs text-[#5C5A55] leading-relaxed pt-1">
                  {s6.content[2]}
                </p>
              )}
            </article>

            {/* Section 7 */}
            <article id="retention" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#E5E1D8]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s7.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s7.title}
              </h2>
              {s7.content[0] && <p>{s7.content[0]}</p>}
              <ul className="list-disc list-inside space-y-2 text-base">
                {s7.content.slice(1).map((pt, ptIdx) => (
                  <li key={ptIdx}>{pt}</li>
                ))}
              </ul>
            </article>

            {/* Section 8 */}
            <article id="rights" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#E5E1D8]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s8.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s8.title}
              </h2>
              {s8.content[0] && <p>{s8.content[0]}</p>}

              <div className="space-y-3 font-sans text-xs">
                {s8.content.slice(1).map((r, rIdx) => (
                  <div key={rIdx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E5E1D8]">
                    <CheckCircle2 className="w-4 h-4 text-[#A84C32] shrink-0 mt-0.5" />
                    <div className="text-[#3A3834] leading-relaxed">
                      {r}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Section 9 */}
            <article id="cookies" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#E5E1D8]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s9.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s9.title}
              </h2>
              {s9.content[0] && <p>{s9.content[0]}</p>}

              <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 font-sans text-xs space-y-3">
                <div className="font-semibold text-[#1A1A1A] text-sm">
                  {s9.title}:
                </div>
                <ul className="space-y-2 text-[#5C5A55]">
                  {s9.content.slice(1, -1).map((c, cIdx) => (
                    <li key={cIdx} className="leading-relaxed">{c}</li>
                  ))}
                </ul>
                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E5E1D8] text-[#A84C32] font-medium">
                  {s9.content[s9.content.length - 1]}
                </div>
              </div>
            </article>

            {/* Section 10 */}
            <article id="grievance" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#E5E1D8]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono uppercase bg-[#A84C32]/10 text-[#A84C32]">
                {s10.num}
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                {s10.title}
              </h2>
              {s10.content[0] && <p>{s10.content[0]}</p>}

              <div className="bg-[#1A1A1A] text-white rounded-2xl p-8 space-y-6 font-sans">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#A84C32] font-semibold">
                      Legal Compliance & Data Governance
                    </div>
                    <div className="text-lg font-serif-display text-white mt-1">
                      Medhashine Data Protection & Grievance Cell
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono">
                    Statutory Grievance Redressal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#B8B2A7]">
                  <div>
                    <span className="text-white font-semibold block mb-1">
                      {s10.content[1] || "Designated Grievance Officer: Ashish Yadav"}
                    </span>
                    <p className="leading-relaxed">
                      {s10.content[2] || "Direct Escalations: privacy@medhashine.in | grievance@medhashine.in"}
                    </p>
                  </div>
                  <div>
                    <span className="text-white font-semibold block mb-1">
                      {s10.content[3] || "Statutory Response Window: 24–48 hours acknowledgement, 15 days resolution"}
                    </span>
                    <p className="leading-relaxed">
                      Complaints are reviewed with cryptographic log verification under statutory supervision.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-[#8C827A]">
                    Official Correspondence: <span className="text-white font-mono">privacy@medhashine.in</span> | <span className="text-white font-mono">grievance@medhashine.in</span>
                  </div>
                  <a
                    href="mailto:privacy@medhashine.in?subject=DPDP%20Statutory%20Privacy%20Grievance"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A84C32] text-white hover:bg-[#8F3E28] transition-colors text-xs font-medium"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {t.bottomCta?.btn || "Submit Privacy Grievance"}
                  </a>
                </div>
              </div>
            </article>
          </main>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-[#E5E1D8] bg-[#F7F4EE] py-12">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">
              {t.bottomCta?.title || "Questions About Your Educational Privacy?"}
            </h3>
            <p className="text-sm font-serif-body text-[#5C5A55] mt-1">
              {t.bottomCta?.desc || "Our dedicated privacy engineering team is here to help you understand how your data is protected."}
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1A1A1A] text-white hover:bg-[#A84C32] transition-colors text-xs font-medium uppercase tracking-wider shrink-0"
          >
            {t.bottomCta?.btn || "Contact Privacy Officer"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
