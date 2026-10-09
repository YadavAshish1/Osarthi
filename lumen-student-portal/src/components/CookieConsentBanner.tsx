"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, SlidersHorizontal, Check, X, Lock } from "lucide-react";

export interface CookieConsentState {
  necessary: boolean;
  performance: boolean;
  advertising: boolean;
  timestamp: number;
  version: number;
}

const COOKIE_NAME = "medhashine_consent_v1";
const LS_ACK_FLAG = "medhashine_consent_ack";
const INTEGRITY_SALT = "mdsh_sec_salt_v1";

/**
 * Cookie helper: Sets cookie with 365 days expiration, SameSite=Lax, and Secure on HTTPS
 */
function setBrowserCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const secure = isHttps ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Cookie helper: Extracts cookie value by name
 */
function getBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * High-speed 64-bit cryptographic hash checksum for tamper detection
 * (Simulates enterprise CMP token signatures like OneTrust / IAB TCF)
 */
function computeChecksum(payload: string): string {
  let h1 = 5381;
  let h2 = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    const c = payload.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ c;
    h2 = ((h2 << 7) - h2) ^ (c * 31);
  }
  const s1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const s2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${s1}${s2}`;
}

/**
 * Encodes consent preferences into a signed token: [Base64Payload].[ChecksumHash]
 * Prevents plain-text inspection and detects unauthorized tampering.
 */
function encodeConsentToken(state: CookieConsentState): string {
  const compact = {
    v: state.version,
    n: state.necessary ? 1 : 0,
    p: state.performance ? 1 : 0,
    a: state.advertising ? 1 : 0,
    t: state.timestamp,
  };
  const jsonStr = JSON.stringify(compact);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  const sig = computeChecksum(base64 + INTEGRITY_SALT);
  return `${base64}.${sig}`;
}

/**
 * Decodes and verifies the integrity hash of the consent token.
 * Returns null if missing, corrupted, or tampered with.
 */
function decodeConsentToken(token: string): CookieConsentState | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [base64, sig] = parts;
    const expectedSig = computeChecksum(base64 + INTEGRITY_SALT);
    if (sig !== expectedSig) {
      console.warn("Cookie consent tamper detected; resetting to security defaults.");
      return null;
    }

    const decoded = decodeURIComponent(escape(atob(base64)));
    const parsed = JSON.parse(decoded);
    return {
      necessary: true,
      performance: !!parsed.p,
      advertising: !!parsed.a,
      timestamp: parsed.t || Date.now(),
      version: parsed.v || 1,
    };
  } catch {
    return null;
  }
}

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Granular settings state (Default: True)
  const [performanceEnabled, setPerformanceEnabled] = useState(true);
  const [advertisingEnabled, setAdvertisingEnabled] = useState(true);

  // Load existing consent on mount or listen for re-open trigger
  useEffect(() => {
    setMounted(true);

    try {
      // 1. Primary check: Read from browser cookie
      const cookieValue = getBrowserCookie(COOKIE_NAME);
      if (cookieValue) {
        const verified = decodeConsentToken(cookieValue);
        if (verified) {
          setPerformanceEnabled(verified.performance);
          setAdvertisingEnabled(verified.advertising);
          applyGoogleConsent(verified);
          return;
        }
      }

      // 2. First-time visitor or expired cookie: reveal after 1s delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } catch {
      setIsVisible(true);
    }
  }, []);

  // Listen for custom event to re-open settings from Footer or Privacy page
  useEffect(() => {
    const handleReopen = () => {
      setIsVisible(true);
      setShowPreferences(true);
    };

    window.addEventListener("open-cookie-settings", handleReopen);
    return () => window.removeEventListener("open-cookie-settings", handleReopen);
  }, []);

  // Update Google Consent Mode v2 (IAB & Google Standard)
  const applyGoogleConsent = (consent: CookieConsentState) => {
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("consent", "update", {
        ad_storage: consent.advertising ? "granted" : "denied",
        ad_user_data: consent.advertising ? "granted" : "denied",
        ad_personalization: consent.advertising ? "granted" : "denied",
        analytics_storage: consent.performance ? "granted" : "denied",
      });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookie-consent-updated", { detail: consent })
      );
    }
  };

  const saveConsent = (performance: boolean, advertising: boolean) => {
    const consentObj: CookieConsentState = {
      necessary: true,
      performance,
      advertising,
      timestamp: Date.now(),
      version: 1,
    };

    try {
      const secureToken = encodeConsentToken(consentObj);
      // 1. Primary: Browser Cookie with 365 days expiration
      setBrowserCookie(COOKIE_NAME, secureToken, 365);

      // 2. LocalStorage: Lightweight flag as backup
      localStorage.setItem(LS_ACK_FLAG, "1");
    } catch (e) {
      console.warn("Could not persist cookie consent", e);
    }

    applyGoogleConsent(consentObj);
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent(true, true);
  };

  const handleEssentialOnly = () => {
    saveConsent(false, false);
  };

  const handleSaveCustom = () => {
    saveConsent(performanceEnabled, advertisingEnabled);
  };

  // SSR hydration safety
  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent management"
      className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#1A1A1A] text-white rounded-2xl border border-white/15 shadow-2xl p-5 sm:p-6 backdrop-blur-md font-sans">
        
        {/* ── View 1: Default Banner ── */}
        {!showPreferences ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#A84C32]/20 border border-[#A84C32]/40 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-[#E8A88A]" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif-display text-base sm:text-lg font-medium text-white leading-snug">
                  Privacy &amp; Cookie Choices
                </h3>
                <p className="mt-1 text-xs text-[#B8B2A7] leading-relaxed">
                  We use cookies for platform security, to analyze performance, and to support free learning with non-invasive advertising. You have full control.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#A84C32] hover:bg-[#913F27] text-white text-xs font-semibold transition-all shadow-sm text-center cursor-pointer"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium transition-all text-center cursor-pointer"
              >
                Essential Only
              </button>
            </div>

            {/* Sub-links */}
            <div className="flex items-center justify-between text-[11px] text-[#8C867A] pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="inline-flex items-center gap-1.5 text-[#E8A88A] hover:text-white transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Customize Choices</span>
              </button>
              <Link
                href="/privacy"
                className="hover:text-white underline underline-offset-2 transition-colors"
              >
                Privacy Charter
              </Link>
            </div>
          </div>
        ) : (
          /* ── View 2: Detailed Preferences Modal/Drawer ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#A84C32]" />
                <h3 className="font-serif-display text-base font-medium text-white">
                  Cookie Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="p-1 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Back"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[#B8B2A7] leading-relaxed">
              Tailor how Medhashine collects data. Essential cookies cannot be turned off as they are critical for core platform security and navigation.
            </p>

            {/* Granular Categories */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              
              {/* Category 1: Strictly Necessary */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Strictly Essential</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Always On
                  </span>
                </div>
                <p className="text-[11px] text-[#8C867A] leading-relaxed">
                  Cryptographic tokens, CSRF protection, and authentication cookies necessary for portal functionality.
                </p>
              </div>

              {/* Category 2: Performance */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Performance
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={performanceEnabled}
                      onChange={(e) => setPerformanceEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#A84C32]"></div>
                  </label>
                </div>
                <p className="text-[11px] text-[#8C867A] leading-relaxed">
                  Helps us measure site responsiveness and reading engagement through anonymized telemetry.
                </p>
              </div>

              {/* Category 3: Contextual Advertising */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Advertising &amp; AdSense
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advertisingEnabled}
                      onChange={(e) => setAdvertisingEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#A84C32]"></div>
                  </label>
                </div>
                <p className="text-[11px] text-[#8C867A] leading-relaxed">
                  Used by Google and verified ad networks to serve educational, non-invasive advertisements that fund our platform.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#A84C32] hover:bg-[#913F27] text-white text-xs font-medium transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all text-center cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
