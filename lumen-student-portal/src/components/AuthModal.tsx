"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { X, ArrowLeft, KeyRound, Mail } from "lucide-react";

export default function AuthModal() {
  const { authModal, closeAuth, login, sendOtp, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (authModal.open) {
      setMode(authModal.mode || "login");
      setStep("form");
      setForm({ name: "", email: "", password: "", role: "student" });
      setOtp("");
      setErr("");
      setCooldown(0);
    }
  }, [authModal.open, authModal.mode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!authModal.open) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const res = await sendOtp(form.name, form.email, form.password, form.role);
    setLoading(false);

    if (res.ok) {
      toast.success(`Verification code sent to ${form.email}`);
      setStep("otp");
      setCooldown(60);
    } else {
      setErr(res.error || "Failed to send verification code");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErr("Please enter the 6-digit code sent to your email.");
      return;
    }
    setErr("");
    setLoading(true);

    const res = await register(form.name, form.email, form.password, form.role, otp.trim());
    setLoading(false);

    if (res.ok) {
      toast.success("Account created successfully!");
      const cb = authModal.onSuccess;
      closeAuth();
      setTimeout(() => cb?.(), 50);
    } else {
      setErr(res.error || "Invalid verification code");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const res = await login(form.email, form.password);
    setLoading(false);

    if (res.ok) {
      toast.success("Welcome back!");
      const cb = authModal.onSuccess;
      closeAuth();
      setTimeout(() => cb?.(), 50);
    } else {
      setErr(res.error || "Authentication failed");
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setErr("");
    setLoading(true);

    const res = await sendOtp(form.name, form.email, form.password, form.role);
    setLoading(false);

    if (res.ok) {
      toast.success("New verification code sent!");
      setCooldown(60);
    } else {
      setErr(res.error || "Failed to resend code");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      data-testid="auth-modal"
    >
      <div
        className="relative w-full max-w-[440px] bg-white border border-[#E5E1D8] rounded-xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeAuth}
          className="absolute top-5 right-5 text-[#5C5A55] hover:text-[#1A1A1A] p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* OTP Step Header vs Standard Header */}
        {step === "otp" ? (
          <div>
            <button
              onClick={() => {
                setStep("form");
                setErr("");
              }}
              className="inline-flex items-center gap-1.5 font-ui text-xs text-[#A84C32] hover:underline mb-3 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to details
            </button>
            <div className="eyebrow text-[#A84C32] mb-2 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Verify Email
            </div>
            <h2 className="font-serif-display text-3xl font-semibold text-[#1A1A1A] leading-tight mb-2">
              Enter Verification Code
            </h2>
            <p className="font-serif-body text-sm text-[#5C5A55]">
              We sent a 6-digit code to <strong className="text-[#1A1A1A]">{form.email}</strong>. Please check your inbox.
            </p>
          </div>
        ) : (
          <div>
            <div className="eyebrow text-[#A84C32] mb-2">
              {mode === "login" ? "Welcome back" : "Join Medhashine"}
            </div>
            <h2 className="font-serif-display text-3xl font-semibold text-[#1A1A1A] leading-tight mb-2">
              {mode === "login"
                ? "Sign in to continue reading"
                : "Create your reading account"}
            </h2>
            <p className="font-serif-body text-sm text-[#5C5A55]">
              {mode === "login"
                ? "Access your saved reflections and participate in discussions."
                : "Free account to leave comments, like insights, and engage with teachers."}
            </p>
          </div>
        )}

        {err && (
          <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-ui">
            {err}
          </div>
        )}

        {/* OTP Input Form */}
        {step === "otp" ? (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4 font-ui">
            <div>
              <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1.5">
                6-Digit Security Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  className="w-full h-12 px-4 tracking-[0.5em] text-center text-xl font-mono border border-[#E5E1D8] rounded-md bg-white text-[#1A1A1A] focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
                />
                <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-[#5C5A55]/40 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full mt-2 h-11 rounded-md bg-[#1A1A1A] text-white font-medium hover:bg-[#A84C32] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <div className="text-center pt-2 font-ui text-xs text-[#5C5A55]">
              Didn&apos;t receive code?{" "}
              {cooldown > 0 ? (
                <span className="text-[#5C5A55]/70">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-[#A84C32] font-semibold hover:underline cursor-pointer"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Standard Login / Signup Form */
          <form
            onSubmit={mode === "login" ? handleLoginSubmit : handleSendOtp}
            className="mt-6 space-y-4 font-ui"
          >
            {mode === "register" && (
              <div>
                <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1.5">
                  Full Name
                </label>
                <input
                  data-testid="auth-name-input"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Aarav Sharma"
                  className="w-full h-11 px-4 border border-[#E5E1D8] rounded-md bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1.5">
                Email Address
              </label>
              <input
                data-testid="auth-email-input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="student@example.com"
                className="w-full h-11 px-4 border border-[#E5E1D8] rounded-md bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1.5">
                Password {mode === "register" && <span className="text-[#A84C32]">(min 8 chars)</span>}
              </label>
              <input
                data-testid="auth-password-input"
                type="password"
                required
                minLength={mode === "register" ? 8 : undefined}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full h-11 px-4 border border-[#E5E1D8] rounded-md bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="auth-submit-button"
              className="w-full mt-2 h-11 rounded-md bg-[#1A1A1A] text-white font-medium hover:bg-[#A84C32] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === "form" && (
          <div className="mt-6 pt-4 border-t border-[#E5E1D8] text-center font-ui text-xs text-[#5C5A55]">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErr("");
                  }}
                  className="text-[#A84C32] font-semibold hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErr("");
                  }}
                  className="text-[#A84C32] font-semibold hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
