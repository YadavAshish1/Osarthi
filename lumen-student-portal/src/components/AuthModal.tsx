"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { X, ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function AuthModal() {
  const router = useRouter();
  const { authModal, closeAuth, login, sendOtp, register, forgotPassword, resetPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [step, setStep] = useState<"form" | "otp" | "forgot-email" | "forgot-reset">("form");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Forgot password specific state
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (authModal.open) {
      const initialMode = authModal.mode || "login";
      setMode(initialMode);
      setStep(initialMode === "forgot" ? "forgot-email" : "form");
      setForm({ name: "", email: "", password: "", role: "student" });
      setOtp("");
      setErr("");
      setCooldown(0);
      setForgotEmail("");
      setResetOtp("");
      setNewPassword("");
      setConfirmPassword("");
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

  // ─── Registration OTP Handlers ────────────────────────────────────────────────

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
      if (cb) {
        setTimeout(() => cb(), 50);
      } else if (res.user?.role === "teacher") {
        router.push("/teacher/dashboard");
      }
    } else {
      setErr(res.error || "Invalid verification code");
    }
  };

  const handleGoogleSignIn = () => {
    const returnTo = typeof window !== "undefined" ? (window.location.pathname + window.location.search) : "/";
    const googleEndpoint = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}&mode=${mode}`;
    window.location.href = googleEndpoint;
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
      if (cb) {
        setTimeout(() => cb(), 50);
      } else if (res.user?.role === "teacher") {
        router.push("/teacher/dashboard");
      }
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

  // ─── Forgot Password Handlers ─────────────────────────────────────────────────

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }
    setErr("");
    setLoading(true);

    const res = await forgotPassword(forgotEmail);
    setLoading(false);

    if (res.ok) {
      toast.success(`Reset code sent to ${forgotEmail}`);
      setStep("forgot-reset");
      setCooldown(60);
    } else {
      setErr(res.error || "Failed to send reset code");
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.trim().length !== 6) {
      setErr("Please enter the 6-digit code sent to your email.");
      return;
    }
    if (newPassword.length < 8) {
      setErr("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    setErr("");
    setLoading(true);

    const res = await resetPassword(forgotEmail, resetOtp.trim(), newPassword);
    setLoading(false);

    if (res.ok) {
      toast.success("Password reset successfully! You can now sign in.");
      // Go back to login
      setMode("login");
      setStep("form");
      setForm({ ...form, email: forgotEmail, password: "" });
      setErr("");
      setForgotEmail("");
      setResetOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setErr(res.error || "Failed to reset password");
    }
  };

  const handleResendForgotOtp = async () => {
    if (cooldown > 0 || loading) return;
    setErr("");
    setLoading(true);

    const res = await forgotPassword(forgotEmail);
    setLoading(false);

    if (res.ok) {
      toast.success("New reset code sent!");
      setCooldown(60);
    } else {
      setErr(res.error || "Failed to resend code");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={closeAuth}
      data-testid="auth-modal"
    >
      <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
        <div
          className="relative w-full max-w-[420px] sm:max-w-[440px] bg-white border border-[#E5E1D8] rounded-2xl p-5 sm:p-7 shadow-2xl text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeAuth}
            className="absolute top-4 right-4 text-[#5C5A55] hover:text-[#1A1A1A] p-2 rounded-full hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* ─── HEADER ────────────────────────────────────────────────────── */}
          {step === "otp" ? (
            <div className="pr-8">
              <button
                onClick={() => {
                  setStep("form");
                  setErr("");
                }}
                className="inline-flex items-center gap-1.5 font-ui text-xs text-[#A84C32] hover:underline mb-2 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to details
              </button>
              <div className="eyebrow text-[#A84C32] mb-1.5 flex items-center gap-1.5 text-[11px]">
                <Mail className="h-3.5 w-3.5" /> Verify Email
              </div>
              <h2 className="font-serif-display text-2xl sm:text-[26px] font-semibold text-[#1A1A1A] leading-snug">
                Enter Verification Code
              </h2>
              <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] mt-1 leading-relaxed">
                We sent a 6-digit code to <strong className="text-[#1A1A1A]">{form.email}</strong>. Please check your inbox.
              </p>
            </div>
          ) : step === "forgot-email" ? (
            <div className="pr-8">
              <button
                onClick={() => {
                  setMode("login");
                  setStep("form");
                  setErr("");
                }}
                className="inline-flex items-center gap-1.5 font-ui text-xs text-[#A84C32] hover:underline mb-2 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
              <div className="eyebrow text-[#A84C32] mb-1.5 flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5" /> Password Reset
              </div>
              <h2 className="font-serif-display text-2xl sm:text-[26px] font-semibold text-[#1A1A1A] leading-snug">
                Forgot your password?
              </h2>
              <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] mt-1 leading-relaxed">
                Enter your registered email and we&apos;ll send you a verification code to reset your password.
              </p>
            </div>
          ) : step === "forgot-reset" ? (
            <div className="pr-8">
              <button
                onClick={() => {
                  setStep("forgot-email");
                  setErr("");
                  setResetOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="inline-flex items-center gap-1.5 font-ui text-xs text-[#A84C32] hover:underline mb-2 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Change email
              </button>
              <div className="eyebrow text-[#A84C32] mb-1.5 flex items-center gap-1.5 text-[11px]">
                <KeyRound className="h-3.5 w-3.5" /> Reset Password
              </div>
              <h2 className="font-serif-display text-2xl sm:text-[26px] font-semibold text-[#1A1A1A] leading-snug">
                Set New Password
              </h2>
              <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] mt-1 leading-relaxed">
                Enter the 6-digit code sent to <strong className="text-[#1A1A1A]">{forgotEmail}</strong> and your new password.
              </p>
            </div>
          ) : (
            <div className="pr-8">
              <div className="eyebrow text-[#A84C32] mb-1 text-[11px]">
                {mode === "login" ? "Welcome back" : "Join Medhashine"}
              </div>
              <h2 className="font-serif-display text-2xl sm:text-[26px] font-semibold text-[#1A1A1A] leading-snug">
                {mode === "login"
                  ? "Sign in to continue reading"
                  : "Create your reading account"}
              </h2>
              <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] mt-1 leading-relaxed">
                {mode === "login"
                  ? "Access your saved reflections and participate in discussions."
                  : "Free account to leave comments, like insights, and engage with teachers."}
              </p>
            </div>
          )}

          {err && (
            <div className="mt-3.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-ui leading-relaxed">
              {err}
            </div>
          )}

          {/* ─── REGISTRATION OTP STEP ─────────────────────────────────────── */}
          {step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="mt-5 space-y-3.5 font-ui">
              <div>
                <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1">
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
                    className="w-full h-11 sm:h-12 px-4 tracking-[0.5em] text-center text-xl font-mono border border-[#E5E1D8] rounded-lg bg-white text-[#1A1A1A] focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
                  />
                  <KeyRound className="absolute left-3 top-3 sm:top-3.5 h-5 w-5 text-[#5C5A55]/40 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full mt-1.5 h-10 sm:h-11 rounded-lg bg-[#1A1A1A] text-white font-medium text-sm hover:bg-[#A84C32] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>

              <div className="text-center pt-1 font-ui text-xs text-[#5C5A55]">
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

          /* ─── FORGOT PASSWORD — EMAIL STEP ────────────────────────────── */
          ) : step === "forgot-email" ? (
            <form onSubmit={handleForgotSubmit} className="mt-5 space-y-3.5 font-ui">
              <div>
                <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="student@example.com"
                  autoFocus
                  className="w-full h-10 sm:h-11 px-3.5 border border-[#E5E1D8] rounded-lg bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !forgotEmail}
                className="w-full mt-1.5 h-10 sm:h-11 rounded-lg bg-[#1A1A1A] text-white font-medium text-sm hover:bg-[#A84C32] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>

          /* ─── FORGOT PASSWORD — OTP + NEW PASSWORD STEP ───────────────── */
          ) : step === "forgot-reset" ? (
            <form onSubmit={handleResetSubmit} className="mt-5 space-y-3.5 font-ui">
              <div>
                <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    autoFocus
                    className="w-full h-11 sm:h-12 px-4 tracking-[0.5em] text-center text-xl font-mono border border-[#E5E1D8] rounded-lg bg-white text-[#1A1A1A] focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
                  />
                  <KeyRound className="absolute left-3 top-3 sm:top-3.5 h-5 w-5 text-[#5C5A55]/40 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1">
                  New Password <span className="text-[#A84C32]">(min 8 chars)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 sm:h-11 px-3.5 border border-[#E5E1D8] rounded-lg bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
                />
              </div>

              <div>
                <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 sm:h-11 px-3.5 border border-[#E5E1D8] rounded-lg bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || resetOtp.length !== 6 || !newPassword || !confirmPassword}
                className="w-full mt-1.5 h-10 sm:h-11 rounded-lg bg-[#1A1A1A] text-white font-medium text-sm hover:bg-[#A84C32] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="text-center pt-1 font-ui text-xs text-[#5C5A55]">
                Didn&apos;t receive code?{" "}
                {cooldown > 0 ? (
                  <span className="text-[#5C5A55]/70">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendForgotOtp}
                    disabled={loading}
                    className="text-[#A84C32] font-semibold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>

          /* ─── STANDARD LOGIN / REGISTER FORM ──────────────────────────── */
          ) : (
            <div className="mt-5 space-y-3 sm:space-y-3.5 font-ui">
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-10 sm:h-11 px-4 border border-[#E5E1D8] rounded-xl bg-white text-[#1A1A1A] font-medium text-sm flex items-center justify-center gap-3 hover:bg-[#FAF8F5] hover:border-[#A84C32]/40 transition-all cursor-pointer shadow-2xs active:scale-[0.99] disabled:opacity-60"
              >
                <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>{mode === "login" ? "Sign in with Google" : "Sign up with Google"}</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2 sm:my-2.5">
                <div className="border-t border-[#E5E1D8] w-full" />
                <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#8C8983] shrink-0 font-medium">
                  or continue with email
                </span>
                <div className="border-t border-[#E5E1D8] w-full" />
              </div>

              <form
                onSubmit={mode === "login" ? handleLoginSubmit : handleSendOtp}
                className="space-y-3 sm:space-y-3.5 font-ui"
              >
                {mode === "register" && (
                  <div>
                    <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1">
                      Full Name
                    </label>
                    <input
                      data-testid="auth-name-input"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Aarav Sharma"
                      className="w-full h-10 sm:h-11 px-3.5 border border-[#E5E1D8] rounded-lg bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32] transition-colors"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1">
                    Email Address
                  </label>
                  <input
                    data-testid="auth-email-input"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full h-10 sm:h-11 px-3.5 border border-[#E5E1D8] rounded-lg bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32] transition-colors"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block eyebrow text-[11px] text-[#5C5A55] mb-1">
                    Password {mode === "register" && <span className="text-[#A84C32] font-normal">(min 8 chars)</span>}
                  </label>
                  <input
                    data-testid="auth-password-input"
                    type="password"
                    required
                    minLength={mode === "register" ? 8 : undefined}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-10 sm:h-11 px-3.5 border border-[#E5E1D8] rounded-lg bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32] transition-colors"
                  />
                </div>

                {/* Forgot Password Link — only on login */}
                {mode === "login" && (
                  <div className="text-right -mt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setStep("forgot-email");
                        setErr("");
                        setForgotEmail(form.email);
                      }}
                      className="font-ui text-xs text-[#A84C32] font-semibold hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="auth-submit-button"
                  className="w-full mt-1 h-10 sm:h-11 rounded-lg bg-[#1A1A1A] text-white font-medium text-sm hover:bg-[#A84C32] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs active:scale-[0.99]"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                    ? "Sign In"
                    : "Send Verification Code"}
                </button>
              </form>
            </div>
          )}

          {/* ─── FOOTER TOGGLE ──────────────────────────────────────────── */}
          {step === "form" && (
            <div className="mt-5 pt-3.5 border-t border-[#E5E1D8] text-center font-ui text-xs text-[#5C5A55]">
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

          {/* Footer for forgot-email step: back to login */}
          {step === "forgot-email" && (
            <div className="mt-5 pt-3.5 border-t border-[#E5E1D8] text-center font-ui text-xs text-[#5C5A55]">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStep("form");
                  setErr("");
                }}
                className="text-[#A84C32] font-semibold hover:underline cursor-pointer"
              >
                Sign in here
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
